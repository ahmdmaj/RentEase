-- =============================================================
-- Migration 009: Vehicle Integrity Hardening
-- Prevents renters from creating vehicles and prevents unauthorized ownership transfer.
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. VEHICLE INSERT AUTHORIZATION
-- ─────────────────────────────────────────────
-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Owners can insert vehicles" ON public.vehicles;

-- Create strict policy that verifies the user is explicitly an owner
CREATE POLICY "Owners can insert vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ─────────────────────────────────────────────
-- 2. PREVENT OWNERSHIP TRANSFER (UPDATE)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.protect_vehicle_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Check if ownership is being transferred
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
        -- Verify if the user is an admin
        SELECT EXISTS (
            SELECT 1 
            FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) INTO v_is_admin;
        
        IF NOT v_is_admin THEN
            RAISE EXCEPTION 'Vehicle ownership transfer is not allowed';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_secure_vehicle_ownership ON public.vehicles;
CREATE TRIGGER ensure_secure_vehicle_ownership
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_vehicle_ownership();
