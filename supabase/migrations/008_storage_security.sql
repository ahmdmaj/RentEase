-- =============================================================
-- Migration 008: Storage Security Hardening
-- Locks down the vehicle-images bucket.
-- =============================================================

-- 1. Configure the bucket (ensure it exists, is public, and restricts files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images', 
  'vehicle-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing permissive policies if any
DROP POLICY IF EXISTS "Public access to vehicle-images" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can upload vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can update vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can delete vehicle images" ON storage.objects;

-- 4. Create secure policies

-- SELECT: Public access (anyone can read the images)
CREATE POLICY "Public access to vehicle-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-images');

-- INSERT: Authorized access only.
-- The user must be authenticated AND the root folder name must match a vehicle_id they own.
-- (storage.foldername(name))[1] extracts the first part of the path 'vehicle_id/file.jpg' -> 'vehicle_id'
CREATE POLICY "Authorized users can upload vehicle images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vehicle-images' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.vehicles WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: Same restrictions as INSERT
CREATE POLICY "Authorized users can update vehicle images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vehicle-images' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.vehicles WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'vehicle-images' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.vehicles WHERE owner_id = auth.uid()
    )
  );

-- DELETE: Same restrictions as UPDATE
CREATE POLICY "Authorized users can delete vehicle images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vehicle-images' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.vehicles WHERE owner_id = auth.uid()
    )
  );
