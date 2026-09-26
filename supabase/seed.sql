-- =============================================================
-- RentEase Database Seed File
-- Populates the database with realistic demo data for portfolio showcasing.
-- Can be run multiple times safely (idempotent).
-- =============================================================
SET search_path TO public, extensions;

-- =============================================================
-- 1. AUTH & PROFILES
-- =============================================================
-- Insert users directly into auth.users.
-- The trigger `handle_new_user` will automatically create `public.profiles`.
-- Passwords for all accounts are set to: password123

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
  ('d43425b0-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@rentease.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin User"}', now(), now(), '', '', '', ''),
  ('d43425b0-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner1@rentease.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"John Owner"}', now(), now(), '', '', '', ''),
  ('d43425b0-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner2@rentease.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Owner"}', now(), now(), '', '', '', ''),
  ('d43425b0-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'renter1@rentease.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alice Renter"}', now(), now(), '', '', '', ''),
  ('d43425b0-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'renter2@rentease.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bob Renter"}', now(), now(), '', '', '', ''),
  ('d43425b0-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'renter3@rentease.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Charlie Renter"}', now(), now(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Since Migration 006 hardcodes all new profiles to 'renter' and prevents role escalation via trigger,
-- we must temporarily disable the protection trigger to manually assign 'admin' and 'owner' roles to the seed users.
ALTER TABLE public.profiles DISABLE TRIGGER ensure_secure_role_update;

UPDATE public.profiles SET role = 'admin' WHERE id = 'd43425b0-0000-0000-0000-000000000001';
UPDATE public.profiles SET role = 'owner' WHERE id = 'd43425b0-0000-0000-0000-000000000002';
UPDATE public.profiles SET role = 'owner' WHERE id = 'd43425b0-0000-0000-0000-000000000003';

ALTER TABLE public.profiles ENABLE TRIGGER ensure_secure_role_update;

-- =============================================================
-- 2. VEHICLES
-- =============================================================
INSERT INTO public.vehicles (id, owner_id, make, model, year, transmission, fuel_type, seating_capacity, location, price_per_day, description, is_available)
VALUES
  ('e1b1c1d1-0000-0000-0000-000000000001', 'd43425b0-0000-0000-0000-000000000002', 'Toyota', 'Prius', 2020, 'Automatic', 'Hybrid', 5, 'Colombo', 8000, 'Well maintained hybrid car, excellent fuel economy.', true),
  ('e1b1c1d1-0000-0000-0000-000000000002', 'd43425b0-0000-0000-0000-000000000002', 'Honda', 'Vezel', 2019, 'Automatic', 'Hybrid', 5, 'Colombo', 10000, 'Comfortable and spacious SUV for family trips.', true),
  ('e1b1c1d1-0000-0000-0000-000000000003', 'd43425b0-0000-0000-0000-000000000003', 'Suzuki', 'Wagon R', 2018, 'Automatic', 'Petrol', 4, 'Kandy', 5000, 'Economical city car, perfect for tight parking spots.', true),
  ('e1b1c1d1-0000-0000-0000-000000000004', 'd43425b0-0000-0000-0000-000000000003', 'Toyota', 'Hiace', 2015, 'Manual', 'Diesel', 14, 'Kandy', 15000, 'Spacious van for group trips and tours.', true),
  ('e1b1c1d1-0000-0000-0000-000000000005', 'd43425b0-0000-0000-0000-000000000003', 'Yamaha', 'FZ', 2021, 'Manual', 'Petrol', 2, 'Kandy', 3000, 'Sporty bike for quick and scenic travel.', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 3. VEHICLE IMAGES
-- =============================================================
INSERT INTO public.vehicle_images (id, vehicle_id, image_url, display_order)
VALUES
  ('f1b1c1d1-0000-0000-0000-000000000001', 'e1b1c1d1-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=800', 0),
  ('f1b1c1d1-0000-0000-0000-000000000002', 'e1b1c1d1-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1568844293986-8d0400bc4745?auto=format&fit=crop&q=80&w=800', 0),
  ('f1b1c1d1-0000-0000-0000-000000000003', 'e1b1c1d1-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1621007947382-d43db054e582?auto=format&fit=crop&q=80&w=800', 0),
  ('f1b1c1d1-0000-0000-0000-000000000004', 'e1b1c1d1-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1583267746897-2cf415887172?auto=format&fit=crop&q=80&w=800', 0),
  ('f1b1c1d1-0000-0000-0000-000000000005', 'e1b1c1d1-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800', 0)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 4. BOOKINGS
-- =============================================================
-- Temporarily disable the booking update trigger to allow seeding various statuses
ALTER TABLE public.bookings DISABLE TRIGGER ensure_secure_booking_update;

INSERT INTO public.bookings (id, vehicle_id, renter_id, start_date, end_date, total_price, status)
VALUES
  -- 1 pending booking (Future)
  ('b1b1c1d1-0000-0000-0000-000000000001', 'e1b1c1d1-0000-0000-0000-000000000001', 'd43425b0-0000-0000-0000-000000000004', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '12 days', 16000, 'pending'),
  
  -- 1 approved booking (Active)
  ('b1b1c1d1-0000-0000-0000-000000000002', 'e1b1c1d1-0000-0000-0000-000000000002', 'd43425b0-0000-0000-0000-000000000005', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '4 days', 30000, 'approved'),
  
  -- 1 completed booking (Past)
  ('b1b1c1d1-0000-0000-0000-000000000003', 'e1b1c1d1-0000-0000-0000-000000000003', 'd43425b0-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '8 days', 10000, 'completed'),
  
  -- 1 rejected booking (Future)
  ('b1b1c1d1-0000-0000-0000-000000000004', 'e1b1c1d1-0000-0000-0000-000000000004', 'd43425b0-0000-0000-0000-000000000004', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '7 days', 30000, 'rejected')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.bookings ENABLE TRIGGER ensure_secure_booking_update;
