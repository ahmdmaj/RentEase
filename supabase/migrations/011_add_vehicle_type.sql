-- Migration 011: Add vehicle_type to vehicles table
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
