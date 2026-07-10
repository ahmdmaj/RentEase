-- ============================================================
-- 1. MASTER NOTIFICATIONS TABLE (Supports all your types)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,  -- Stores IDs (booking_id, vehicle_id, etc.)
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own, and update their own (to mark as read)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 2. HELPERS: Function to notify ALL Admins
-- ============================================================
CREATE OR REPLACE FUNCTION notify_all_admins(
    p_type TEXT,
    p_title TEXT,
    p_body TEXT,
    p_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    admin_record RECORD;
BEGIN
    FOR admin_record IN SELECT id FROM profiles WHERE role = 'admin'
    LOOP
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (admin_record.id, p_type, p_title, p_body, p_data);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. TRIGGER 1: Welcome Notification
-- ============================================================
CREATE OR REPLACE FUNCTION notify_welcome()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (
        NEW.id,
        'system_welcome',
        '🚗 Welcome to RentEase!',
        'Get started by browsing available vehicles or listing your own car to earn money.'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_created_notify ON profiles;
CREATE TRIGGER on_user_created_notify
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION notify_welcome();

-- ============================================================
-- 4. TRIGGER 2: Owner - New Booking Request (Renter -> Owner)
-- ============================================================
CREATE OR REPLACE FUNCTION notify_owner_new_booking()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_id UUID;
    v_vehicle_text TEXT;
BEGIN
    SELECT owner_id, make || ' ' || model INTO v_owner_id, v_vehicle_text
    FROM vehicles WHERE id = NEW.vehicle_id;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
        v_owner_id,
        'owner_booking_request',
        '📩 New Booking Request!',
        'Someone wants to rent your ' || v_vehicle_text || ' from ' || NEW.start_date || ' to ' || NEW.end_date,
        jsonb_build_object('booking_id', NEW.id, 'vehicle_id', NEW.vehicle_id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_booking_created_notify ON bookings;
CREATE TRIGGER on_booking_created_notify
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_owner_new_booking();

-- ============================================================
-- 5. TRIGGER 3: Renter - Booking Approved / Rejected & Owner - Booking Completed
-- ============================================================
CREATE OR REPLACE FUNCTION notify_booking_status_update()
RETURNS TRIGGER AS $$
DECLARE
    v_renter_id UUID;
    v_owner_id UUID;
    v_vehicle_text TEXT;
BEGIN
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    SELECT renter_id, vehicle_id INTO v_renter_id, v_vehicle_text FROM bookings WHERE id = NEW.id;
    SELECT make || ' ' || model INTO v_vehicle_text FROM vehicles WHERE id = NEW.vehicle_id;

    -- A) Notify Renter: Approved / Rejected / Cancelled
    IF NEW.status = 'approved' THEN
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (
            v_renter_id,
            'renter_booking_approved',
            '✅ Booking Approved!',
            'Your booking for ' || v_vehicle_text || ' is confirmed! Get ready to pick it up.',
            jsonb_build_object('booking_id', NEW.id)
        );
    ELSIF NEW.status = 'rejected' THEN
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (
            v_renter_id,
            'renter_booking_rejected',
            '❌ Booking Declined',
            'The owner could not accept your booking for ' || v_vehicle_text || '. Please try another vehicle.',
            jsonb_build_object('booking_id', NEW.id)
        );
    ELSIF NEW.status = 'cancelled' AND OLD.status = 'pending' THEN
        -- B) Notify Owner: Booking Cancelled (by Renter)
        SELECT owner_id INTO v_owner_id FROM vehicles WHERE id = NEW.vehicle_id;
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (
            v_owner_id,
            'owner_booking_cancelled',
            '🗑️ Booking Cancelled',
            'The renter has cancelled their booking for ' || v_vehicle_text || '.',
            jsonb_build_object('booking_id', NEW.id)
        );
    ELSIF NEW.status = 'completed' THEN
        -- C) Notify Owner: Booking Completed
        SELECT owner_id INTO v_owner_id FROM vehicles WHERE id = NEW.vehicle_id;
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (
            v_owner_id,
            'owner_booking_completed',
            '🔄 Rental Completed!',
            'The rental for ' || v_vehicle_text || ' has been marked as completed. Thank you!',
            jsonb_build_object('booking_id', NEW.id)
        );
        -- D) Notify Renter: Leave a Review
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (
            v_renter_id,
            'renter_leave_review',
            '⭐ How was your experience?',
            'Leave a review for the owner of the ' || v_vehicle_text || ' to help the community.',
            jsonb_build_object('booking_id', NEW.id, 'vehicle_id', NEW.vehicle_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_booking_status_change_notify ON bookings;
CREATE TRIGGER on_booking_status_change_notify
    AFTER UPDATE OF status ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_booking_status_update();

-- ============================================================
-- 6. TRIGGER 4: Admin - New Vehicle Listed
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admin_new_vehicle()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_name TEXT;
BEGIN
    SELECT full_name INTO v_owner_name FROM profiles WHERE id = NEW.owner_id;
    PERFORM notify_all_admins(
        'admin_new_vehicle',
        '🚗 New Vehicle Listed!',
        v_owner_name || ' has listed a ' || NEW.make || ' ' || NEW.model || ' (LKR ' || NEW.price_per_day || '/day)',
        jsonb_build_object('vehicle_id', NEW.id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_vehicle_created_notify ON vehicles;
CREATE TRIGGER on_vehicle_created_notify
    AFTER INSERT ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_vehicle();

-- ============================================================
-- 7. TRIGGER 5: System - Password / Email Changed (via Auth)
-- ============================================================
CREATE OR REPLACE FUNCTION notify_auth_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (
            NEW.id,
            'system_email_changed',
            '📧 Email Updated',
            'Your account email was successfully changed.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. RPC FUNCTIONS (For Manual Triggers)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_approve_vehicle(
    p_vehicle_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_owner_id UUID;
    v_vehicle_text TEXT;
BEGIN
    SELECT owner_id, make || ' ' || model INTO v_owner_id, v_vehicle_text 
    FROM vehicles WHERE id = p_vehicle_id;
    
    UPDATE vehicles SET is_available = true WHERE id = p_vehicle_id;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
        v_owner_id,
        'owner_vehicle_approved',
        '✅ Vehicle Approved!',
        'Your ' || v_vehicle_text || ' has been approved and is now visible to renters!',
        jsonb_build_object('vehicle_id', p_vehicle_id)
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION start_rental(p_booking_id UUID)
RETURNS VOID AS $$
DECLARE
    v_renter_id UUID;
    v_vehicle_text TEXT;
BEGIN
    SELECT renter_id, vehicles.make || ' ' || vehicles.model INTO v_renter_id, v_vehicle_text
    FROM bookings 
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    WHERE bookings.id = p_booking_id;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
        v_renter_id,
        'renter_rental_starts',
        '🚗 Rental Starts Now!',
        'Your rental for ' || v_vehicle_text || ' has officially started. Enjoy your ride!',
        jsonb_build_object('booking_id', p_booking_id)
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_password_reset(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (
        p_user_id,
        'system_password_reset',
        '🔑 Password Reset',
        'Your password was successfully reset. If this wasn''t you, contact support immediately.'
    );
END;
$$ LANGUAGE plpgsql;
