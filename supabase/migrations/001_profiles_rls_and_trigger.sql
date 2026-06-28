-- =============================================================
-- Migration 001: Profiles RLS Policies + Auto-create Trigger
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================


-- ─────────────────────────────────────────────
-- 1. RLS POLICIES FOR profiles
-- ─────────────────────────────────────────────

-- Drop existing policies first so this script is safe to re-run
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow a user to INSERT their own profile row (needed on signup)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow a user to SELECT their own profile row
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow a user to UPDATE their own profile row
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ─────────────────────────────────────────────
-- 2. AUTO-CREATE PROFILE ON SIGNUP (trigger)
--    This creates the profile row automatically
--    the moment a new auth.users entry is made.
--    role defaults to 'renter'; the app can then
--    upsert with role='owner' for owner signups.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- runs as DB owner, bypasses RLS
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'renter'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;   -- safe to call multiple times
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
