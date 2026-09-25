-- =============================================================
-- Migration 010: Business Logic Hardening
-- Resolves Phase 2 vulnerabilities: Invalid Dates, Early Completion, 
-- Duplicate Pending Bookings, and Soft Deletion.
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. VEHICLE SOFT DELETION
-- ─────────────────────────────────────────────
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Prevent hard deletion of vehicles to preserve historical bookings
CREATE OR REPLACE FUNCTION public.prevent_vehicle_hard_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RAISE EXCEPTION 'Hard deletion is disabled to preserve booking history. Please set is_active = false instead.';
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS ensure_no_vehicle_hard_deletion ON public.vehicles;
CREATE TRIGGER ensure_no_vehicle_hard_deletion
  BEFORE DELETE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_vehicle_hard_deletion();


-- ─────────────────────────────────────────────
-- 2. SECURE THE check_and_create_booking RPC
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_and_create_booking(
    p_vehicle_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_renter_id UUID;
    v_overlap_count INT;
    v_duplicate_pending INT;
    v_price_per_day FLOAT;
    v_total_price FLOAT;
    v_vehicle_active BOOLEAN;
    v_new_booking_id UUID;
BEGIN
    -- 1. Authentication
    v_renter_id := auth.uid();
    IF v_renter_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create a booking.';
    END IF;

    -- 2. Date Validation (Fixes zero-day, negative, and past bookings)
    IF p_start_date >= p_end_date THEN
        RAISE EXCEPTION 'Booking start date must be before end date.';
    END IF;
    
    IF p_start_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Booking start date cannot be in the past.';
    END IF;

    -- 3. Vehicle Validation & Pricing
    SELECT price_per_day, is_active INTO v_price_per_day, v_vehicle_active
    FROM public.vehicles
    WHERE id = p_vehicle_id;

    IF v_price_per_day IS NULL THEN
        RAISE EXCEPTION 'Vehicle not found';
    END IF;

    IF v_vehicle_active = false THEN
        RAISE EXCEPTION 'This vehicle is no longer active and cannot be booked.';
    END IF;

    -- 4. Double Submission Protection
    SELECT COUNT(*) INTO v_duplicate_pending
    FROM public.bookings
    WHERE renter_id = v_renter_id
      AND vehicle_id = p_vehicle_id
      AND start_date = p_start_date
      AND end_date = p_end_date
      AND status = 'pending';

    IF v_duplicate_pending > 0 THEN
        RAISE EXCEPTION 'You already have a pending booking request for these exact dates.';
    END IF;

    -- 5. Approved Overlap Protection (Double-Booking)
    SELECT COUNT(*) INTO v_overlap_count
    FROM public.bookings
    WHERE vehicle_id = p_vehicle_id
      AND status = 'approved'
      AND daterange(start_date, end_date, '[)') && daterange(p_start_date, p_end_date, '[)');

    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'Vehicle is already booked for the selected dates.';
    END IF;

    -- 6. Calculate Price
    v_total_price := (p_end_date - p_start_date) * v_price_per_day;

    -- 7. Insert Booking
    INSERT INTO public.bookings (
        vehicle_id,
        renter_id,
        start_date,
        end_date,
        total_price,
        status
    ) VALUES (
        p_vehicle_id,
        v_renter_id,
        p_start_date,
        p_end_date,
        v_total_price,
        'pending'
    )
    RETURNING id INTO v_new_booking_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'booking_id', v_new_booking_id,
        'total_price', v_total_price,
        'status', 'pending'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM
        );
END;
$$;


-- ─────────────────────────────────────────────
-- 3. PREVENT EARLY COMPLETION
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.protect_booking_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_is_owner BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
    SELECT EXISTS (SELECT 1 FROM public.vehicles WHERE id = OLD.vehicle_id AND owner_id = auth.uid()) INTO v_is_owner;

    -- A. Immutability
    IF NOT v_is_admin THEN
        IF NEW.vehicle_id IS DISTINCT FROM OLD.vehicle_id OR
           NEW.renter_id IS DISTINCT FROM OLD.renter_id OR
           NEW.total_price IS DISTINCT FROM OLD.total_price THEN
            RAISE EXCEPTION 'Immutable fields (vehicle_id, renter_id, total_price) cannot be modified.';
        END IF;
    END IF;

    -- B. Status Transitions
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        -- Prevent Early Completion
        IF NEW.status = 'completed' THEN
            IF CURRENT_DATE < OLD.end_date THEN
                RAISE EXCEPTION 'Cannot complete a booking before its rental end date.';
            END IF;
        END IF;

        IF NEW.status IN ('approved', 'rejected') THEN
            IF NOT (v_is_owner OR v_is_admin) THEN
                RAISE EXCEPTION 'Only the vehicle owner or an admin can approve/reject bookings';
            END IF;
        END IF;
        
        IF NOT (v_is_owner OR v_is_admin) AND OLD.renter_id = auth.uid() THEN
            IF NEW.status != 'cancelled' THEN
                RAISE EXCEPTION 'Renters can only update their booking to cancelled.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────
-- 4. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_status ON public.bookings(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_renter_id ON public.bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON public.vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_active ON public.vehicles(is_active);
