-- =============================================================
-- Migration 007: Booking Integrity Hardening
-- Prevents price manipulation, unauthorized approvals, and RPC bypasses.
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. REMOVE DIRECT BOOKING INSERT PERMISSIONS
-- ─────────────────────────────────────────────
-- Dropping this forces clients to use the secure RPC function.
DROP POLICY IF EXISTS "Renters can create bookings" ON public.bookings;

-- ─────────────────────────────────────────────
-- 2. SECURE THE check_and_create_booking RPC
-- ─────────────────────────────────────────────
-- Drop the old version if it existed with 4 arguments
DROP FUNCTION IF EXISTS public.check_and_create_booking(UUID, UUID, DATE, DATE);

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
    v_price_per_day FLOAT;
    v_total_price FLOAT;
    v_new_booking_id UUID;
BEGIN
    -- Securely extract renter ID from auth context
    v_renter_id := auth.uid();
    IF v_renter_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create a booking.';
    END IF;

    -- Retrieve the vehicle price directly from the source of truth
    SELECT price_per_day INTO v_price_per_day
    FROM public.vehicles
    WHERE id = p_vehicle_id;

    IF v_price_per_day IS NULL THEN
        RAISE EXCEPTION 'Vehicle not found';
    END IF;

    -- Check for overlapping approved bookings
    SELECT COUNT(*) INTO v_overlap_count
    FROM public.bookings
    WHERE vehicle_id = p_vehicle_id
      AND status = 'approved'
      AND daterange(start_date, end_date, '[)') && daterange(p_start_date, p_end_date, '[)');

    -- If overlap found, rollback by throwing an error
    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'Vehicle is already booked for the selected dates.';
    END IF;

    -- Calculate total price securely on the backend
    v_total_price := (p_end_date - p_start_date) * v_price_per_day;

    -- Insert the booking (status is strictly hardcoded to 'pending')
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

    -- Return success payload
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
-- 3. PREVENT BOOKING FIELD TAMPERING
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
    -- Check if the user is an admin
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
          AND role = 'admin'
    ) INTO v_is_admin;

    -- Check if the user is the owner of the vehicle
    SELECT EXISTS (
        SELECT 1 
        FROM public.vehicles 
        WHERE id = OLD.vehicle_id 
          AND owner_id = auth.uid()
    ) INTO v_is_owner;

    -- A. Immutability: Core fields cannot be changed by non-admins
    IF NOT v_is_admin THEN
        IF NEW.vehicle_id IS DISTINCT FROM OLD.vehicle_id OR
           NEW.renter_id IS DISTINCT FROM OLD.renter_id OR
           NEW.total_price IS DISTINCT FROM OLD.total_price THEN
            RAISE EXCEPTION 'Immutable fields (vehicle_id, renter_id, total_price) cannot be modified.';
        END IF;
    END IF;

    -- B. Status Transitions
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        -- Only owners and admins can approve/reject
        IF NEW.status IN ('approved', 'rejected') THEN
            IF NOT (v_is_owner OR v_is_admin) THEN
                RAISE EXCEPTION 'Only the vehicle owner or an admin can approve/reject bookings';
            END IF;
        END IF;
        
        -- Renters can only cancel
        IF NOT (v_is_owner OR v_is_admin) AND OLD.renter_id = auth.uid() THEN
            IF NEW.status != 'cancelled' THEN
                RAISE EXCEPTION 'Renters can only update their booking to cancelled.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_secure_booking_update ON public.bookings;
CREATE TRIGGER ensure_secure_booking_update
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_booking_updates();
