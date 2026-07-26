-- =============================================================
-- Migration 005: Payment System — RLS, Booking Status Update & Trigger
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. ADD payment_status COLUMN TO bookings
-- ─────────────────────────────────────────────
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
CHECK (payment_status IN ('unpaid', 'paid', 'refunded'));

-- ─────────────────────────────────────────────
-- 2. ADD 'confirmed' TO bookings status CHECK
-- ─────────────────────────────────────────────
-- Drop the existing status constraint and recreate with 'confirmed' included
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN ('pending', 'approved', 'confirmed', 'rejected', 'completed', 'cancelled'));

-- ─────────────────────────────────────────────
-- 3. ADD razorpay_order_id TO payments TABLE
-- (for idempotency and Razorpay reconciliation)
-- ─────────────────────────────────────────────
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;

-- ─────────────────────────────────────────────
-- 4. RLS POLICIES ON payments TABLE
-- ─────────────────────────────────────────────
-- The payments table was created but had no RLS policies (migration 001-004 skipped it).

DROP POLICY IF EXISTS "Renters can view own payments" ON payments;
DROP POLICY IF EXISTS "Renters can insert own payments" ON payments;
DROP POLICY IF EXISTS "Renters and admins can update payments" ON payments;
DROP POLICY IF EXISTS "Owners can view payments for their vehicles" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

-- Renters can view their own booking's payment
CREATE POLICY "Renters can view own payments"
  ON payments FOR SELECT
  USING (
    auth.uid() IN (SELECT renter_id FROM bookings WHERE id = booking_id)
  );

-- Owners can view payments for their vehicle bookings
CREATE POLICY "Owners can view payments for their vehicles"
  ON payments FOR SELECT
  USING (
    auth.uid() IN (
      SELECT v.owner_id
      FROM bookings b
      JOIN vehicles v ON v.id = b.vehicle_id
      WHERE b.id = booking_id
    )
  );

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Renters can create a payment record for their own booking
CREATE POLICY "Renters can insert own payments"
  ON payments FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT renter_id FROM bookings WHERE id = booking_id)
  );

-- Renters and admins can update payment records
-- (needed to update status after Razorpay confirms payment)
CREATE POLICY "Renters and admins can update payments"
  ON payments FOR UPDATE
  USING (
    auth.uid() IN (SELECT renter_id FROM bookings WHERE id = booking_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────────────
-- 5. DB TRIGGER: Auto-confirm booking when payment succeeds
-- When a payment row is updated to status='success',
-- automatically set the linked booking to:
--   status = 'confirmed'
--   payment_status = 'paid'
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_payment_success()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when status transitions TO 'success'
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    UPDATE bookings
    SET
      status = 'confirmed',
      payment_status = 'paid'
    WHERE id = NEW.booking_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers to avoid duplicates
DROP TRIGGER IF EXISTS on_payment_update_success ON payments;
DROP TRIGGER IF EXISTS on_payment_insert_success ON payments;

-- Trigger on UPDATE (most common — status goes from pending → success)
CREATE TRIGGER on_payment_update_success
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_payment_success();

-- Trigger on INSERT (edge case — payment created with status='success' directly)
CREATE TRIGGER on_payment_insert_success
  AFTER INSERT ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'success')
  EXECUTE FUNCTION handle_payment_success();

-- ─────────────────────────────────────────────
-- 6. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings (payment_status);
