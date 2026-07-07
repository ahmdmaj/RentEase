-- =============================================================
-- Migration 002: Complete Admin & Table RLS Policies
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================
-- Why this is needed:
-- By default, Supabase Row Level Security (RLS) silently blocks any 
-- UPDATE / DELETE query if the logged-in user does not match an RLS policy.
-- When Admins click "Grant Approval" or "Approve Owner", those queries
-- were silently updating 0 rows because no Admin RLS policies existed!
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. PROFILES TABLE POLICIES
-- ─────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Anyone can view profiles (needed so renter/admin can see owner names & phone numbers)
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update ANY profile (needed when granting 'owner' role upon approval)
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ─────────────────────────────────────────────
-- 2. VEHICLES TABLE POLICIES (The Culprit!)
-- ─────────────────────────────────────────────
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read vehicles" ON vehicles;
DROP POLICY IF EXISTS "Owners can insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Owners and Admins can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Owners and Admins can delete vehicles" ON vehicles;

-- Public can read all vehicles
CREATE POLICY "Public read vehicles"
  ON vehicles FOR SELECT
  USING (true);

-- Owners can insert their own vehicles
CREATE POLICY "Owners can insert vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners and Admins can update vehicles (enables Admin "Grant Approval" button!)
CREATE POLICY "Owners and Admins can update vehicles"
  ON vehicles FOR UPDATE
  USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Owners and Admins can delete vehicles
CREATE POLICY "Owners and Admins can delete vehicles"
  ON vehicles FOR DELETE
  USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ─────────────────────────────────────────────
-- 3. OWNER APPLICATIONS TABLE POLICIES
-- ─────────────────────────────────────────────
ALTER TABLE owner_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users and Admins can view applications" ON owner_applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON owner_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON owner_applications;

-- Users can view their own applications, Admins can view all
CREATE POLICY "Users and Admins can view applications"
  ON owner_applications FOR SELECT
  USING (
    auth.uid() = profile_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can insert their own applications
CREATE POLICY "Users can insert own applications"
  ON owner_applications FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Admins can update application status (enables Admin "Approve/Reject" buttons!)
CREATE POLICY "Admins can update applications"
  ON owner_applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ─────────────────────────────────────────────
-- 4. VEHICLE IMAGES TABLE POLICIES
-- ─────────────────────────────────────────────
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read vehicle images" ON vehicle_images;
DROP POLICY IF EXISTS "Owners and Admins can manage images" ON vehicle_images;

CREATE POLICY "Public read vehicle images"
  ON vehicle_images FOR SELECT
  USING (true);

CREATE POLICY "Owners and Admins can manage images"
  ON vehicle_images FOR ALL
  USING (
    auth.uid() IN (SELECT owner_id FROM vehicles WHERE id = vehicle_id) OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ─────────────────────────────────────────────
-- 5. BOOKINGS TABLE POLICIES
-- ─────────────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users and Admins can view bookings" ON bookings;
DROP POLICY IF EXISTS "Renters can create bookings" ON bookings;
DROP POLICY IF EXISTS "Participants and Admins can update bookings" ON bookings;

CREATE POLICY "Users and Admins can view bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = renter_id OR 
    auth.uid() IN (SELECT owner_id FROM vehicles WHERE id = vehicle_id) OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Renters can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Participants and Admins can update bookings"
  ON bookings FOR UPDATE
  USING (
    auth.uid() = renter_id OR 
    auth.uid() IN (SELECT owner_id FROM vehicles WHERE id = vehicle_id) OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
