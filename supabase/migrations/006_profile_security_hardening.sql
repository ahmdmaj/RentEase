-- =============================================================
-- Migration 006: Profile Security Hardening
-- Prevents privilege escalation during and after signup.
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. FIX SIGNUP TRIGGER (Prevent Initial Privilege Escalation)
-- ─────────────────────────────────────────────
-- Replaces the function from 001_profiles_rls_and_trigger.sql
-- Forces role to 'renter' regardless of client metadata.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'renter', -- Hardcoded to prevent client-side spoofing
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────
-- 2. PROTECT profiles.role COLUMN (Prevent Post-Signup Escalation)
-- ─────────────────────────────────────────────
-- Ensures only existing admins can modify the role column.

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as DB owner to check admin status
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- If the role is being changed...
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    
    -- Check if the user performing the update is an admin
    SELECT EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND role = 'admin'
    ) INTO v_is_admin;
    
    -- If not an admin, deny the modification
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Unauthorized role modification';
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach the BEFORE UPDATE trigger to profiles
DROP TRIGGER IF EXISTS ensure_secure_role_update ON public.profiles;
CREATE TRIGGER ensure_secure_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();
