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
INSERT INTO public.vehicles (id, owner_id, make, model, year, transmission, fuel_type, seating_capacity, location, price_per_day, description, is_available, vehicle_type)
VALUES
  -- John Owner vehicles
  ('e1b1c1d1-0000-0000-0000-000000000001', 'd43425b0-0000-0000-0000-000000000002', 'Toyota', 'Prius', 2020, 'Automatic', 'Hybrid', 5, 'Colombo', 8000, 'Comfortable hybrid car ideal for city and long-distance driving.', true, 'Car'),
  ('e1b1c1d1-0000-0000-0000-000000000003', 'd43425b0-0000-0000-0000-000000000002', 'Suzuki', 'Wagon R', 2018, 'Automatic', 'Hybrid', 4, 'Gampaha', 5000, 'Economical city car with great fuel efficiency.', true, 'Car'),
  ('e1b1c1d1-0000-0000-0000-000000000005', 'd43425b0-0000-0000-0000-000000000002', 'Honda', 'Fit', 2017, 'Automatic', 'Petrol', 5, 'Kurunegala', 7000, 'Versatile hatchback with magic seats for extra luggage.', true, 'Car'),
  ('e1b1c1d1-0000-0000-0000-000000000007', 'd43425b0-0000-0000-0000-000000000002', 'Nissan', 'Leaf', 2018, 'Automatic', 'Electric', 5, 'Negombo', 7500, 'Fully electric car providing a quiet and eco-friendly ride.', true, 'Car'),
  ('e1b1c1d1-0000-0000-0000-000000000009', 'd43425b0-0000-0000-0000-000000000002', 'Bajaj', 'Pulsar 150', 2021, 'Manual', 'Petrol', 2, 'Colombo', 2500, 'Reliable manual motorcycle for quick city commuting.', true, 'Bike'),
  ('e1b1c1d1-0000-0000-0000-000000000011', 'd43425b0-0000-0000-0000-000000000002', 'Toyota', 'Corolla Axio', 2018, 'Automatic', 'Hybrid', 5, 'Matara', 8500, 'Premium hybrid sedan with a comfortable interior.', true, 'Car'),
  ('e1b1c1d1-0000-0000-0000-000000000013', 'd43425b0-0000-0000-0000-000000000002', 'Toyota', 'Land Cruiser', 2020, 'Automatic', 'Diesel', 7, 'Colombo', 25000, 'High-end luxury SUV offering premium off-road performance.', true, 'SUV'),
  ('e1b1c1d1-0000-0000-0000-000000000015', 'd43425b0-0000-0000-0000-000000000002', 'Kia', 'Sorento', 2019, 'Automatic', 'Diesel', 7, 'Nuwara Eliya', 15000, 'Comfortable 7-seater SUV excellent for hill country travel.', true, 'SUV'),
  ('e1b1c1d1-0000-0000-0000-000000000017', 'd43425b0-0000-0000-0000-000000000002', 'Hyundai', 'Tucson', 2021, 'Automatic', 'Petrol', 5, 'Colombo', 14000, 'Modern and sleek SUV equipped with the latest safety features.', true, 'SUV'),
  ('e1b1c1d1-0000-0000-0000-000000000019', 'd43425b0-0000-0000-0000-000000000002', 'Toyota', 'Vitz', 2019, 'Automatic', 'Petrol', 5, 'Jaffna', 6000, 'Popular automatic hatchback known for reliability.', true, 'Car'),
  ('e1b1c1d1-0000-0000-0000-000000000021', 'd43425b0-0000-0000-0000-000000000002', 'Mahindra', 'Bolero', 2018, 'Manual', 'Diesel', 2, 'Kalmunai', 7000, 'Heavy-duty pickup truck for agricultural or commercial use.', true, 'Truck'),
  ('e1b1c1d1-0000-0000-0000-000000000023', 'd43425b0-0000-0000-0000-000000000002', 'TVS', 'Ntorq', 2021, 'Automatic', 'Petrol', 2, 'Colombo', 2200, 'Powerful 125cc scooter featuring digital connectivity.', true, 'Scooter'),
  ('e1b1c1d1-0000-0000-0000-000000000025', 'd43425b0-0000-0000-0000-000000000002', 'Toyota', 'Premio', 2018, 'Automatic', 'Petrol', 5, 'Gampaha', 11000, 'Luxury sedan with premium interior finishes and smooth ride.', true, 'Car'),
  -- Sarah Owner vehicles
  ('e1b1c1d1-0000-0000-0000-000000000002', 'd43425b0-0000-0000-0000-000000000003', 'Honda', 'Vezel', 2019, 'Automatic', 'Hybrid', 5, 'Kandy', 10000, 'Stylish and spacious hybrid SUV for family trips.', true, 'SUV'),
  ('e1b1c1d1-0000-0000-0000-000000000004', 'd43425b0-0000-0000-0000-000000000003', 'Toyota', 'Aqua', 2015, 'Automatic', 'Hybrid', 5, 'Galle', 6500, 'Compact hybrid vehicle perfect for easy city parking.', true, 'Car'),
  ('e1b1c1d1-0000-0000-0000-000000000006', 'd43425b0-0000-0000-0000-000000000003', 'Toyota', 'KDH', 2016, 'Manual', 'Diesel', 14, 'Kalmunai', 12000, 'Spacious 14-seater van, ideal for large group tours.', true, 'Van'),
  ('e1b1c1d1-0000-0000-0000-000000000008', 'd43425b0-0000-0000-0000-000000000003', 'Mitsubishi', 'Montero', 2015, 'Automatic', 'Diesel', 7, 'Kandy', 18000, 'Luxury 4x4 SUV built for tough terrains and comfort.', true, 'SUV'),
  ('e1b1c1d1-0000-0000-0000-000000000010', 'd43425b0-0000-0000-0000-000000000003', 'Honda', 'Dio', 2022, 'Automatic', 'Petrol', 2, 'Galle', 2000, 'Lightweight and stylish automatic scooter.', true, 'Scooter'),
  ('e1b1c1d1-0000-0000-0000-000000000012', 'd43425b0-0000-0000-0000-000000000003', 'Suzuki', 'Alto', 2019, 'Manual', 'Petrol', 4, 'Gampaha', 4000, 'Budget-friendly manual car with excellent mileage.', true, 'Car'),
  ('e1b1c1d1-0000-0000-0000-000000000014', 'd43425b0-0000-0000-0000-000000000003', 'Tata', 'Dimo Batta', 2017, 'Manual', 'Diesel', 2, 'Kurunegala', 6000, 'Small utility truck for transporting light cargo.', true, 'Truck'),
  ('e1b1c1d1-0000-0000-0000-000000000016', 'd43425b0-0000-0000-0000-000000000003', 'Nissan', 'Caravan', 2016, 'Automatic', 'Diesel', 12, 'Negombo', 11000, 'Reliable automatic van suited for family vacations.', true, 'Van'),
  ('e1b1c1d1-0000-0000-0000-000000000018', 'd43425b0-0000-0000-0000-000000000003', 'Yamaha', 'FZ-S', 2020, 'Manual', 'Petrol', 2, 'Kandy', 3000, 'Sporty motorcycle with great handling and performance.', true, 'Bike'),
  ('e1b1c1d1-0000-0000-0000-000000000020', 'd43425b0-0000-0000-0000-000000000003', 'Honda', 'Civic', 2020, 'Automatic', 'Petrol', 5, 'Colombo', 12000, 'Sporty sedan offering exceptional handling and luxury.', true, 'Car'),
  ('e1b1c1d1-0000-0000-0000-000000000022', 'd43425b0-0000-0000-0000-000000000003', 'Suzuki', 'Celerio', 2022, 'Automatic', 'Petrol', 5, 'Matara', 5500, 'Compact city car with ample boot space and auto transmission.', true, 'Car'),
  ('e1b1c1d1-0000-0000-0000-000000000024', 'd43425b0-0000-0000-0000-000000000003', 'Daihatsu', 'Terios', 2014, 'Automatic', 'Petrol', 5, 'Nuwara Eliya', 8000, 'Compact mini SUV great for narrow and hilly roads.', true, 'SUV')
ON CONFLICT (id) DO UPDATE SET
  make = EXCLUDED.make, model = EXCLUDED.model, year = EXCLUDED.year,
  transmission = EXCLUDED.transmission, fuel_type = EXCLUDED.fuel_type,
  seating_capacity = EXCLUDED.seating_capacity, location = EXCLUDED.location,
  price_per_day = EXCLUDED.price_per_day, description = EXCLUDED.description,
  vehicle_type = EXCLUDED.vehicle_type;

-- =============================================================
-- 3. VEHICLE IMAGES
-- =============================================================
INSERT INTO public.vehicle_images (id, vehicle_id, image_url, display_order)
VALUES
  ('f1b1c1d1-0000-0000-0000-000000000001', 'e1b1c1d1-0000-0000-0000-000000000001', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Toyota+Prius', 0),
  ('f1b1c1d1-0000-0000-0000-000000000002', 'e1b1c1d1-0000-0000-0000-000000000003', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Suzuki+Wagon+R', 0),
  ('f1b1c1d1-0000-0000-0000-000000000003', 'e1b1c1d1-0000-0000-0000-000000000005', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Honda+Fit', 0),
  ('f1b1c1d1-0000-0000-0000-000000000004', 'e1b1c1d1-0000-0000-0000-000000000007', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Nissan+Leaf', 0),
  ('f1b1c1d1-0000-0000-0000-000000000005', 'e1b1c1d1-0000-0000-0000-000000000009', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Bajaj+Pulsar+150', 0),
  ('f1b1c1d1-0000-0000-0000-000000000006', 'e1b1c1d1-0000-0000-0000-000000000011', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Toyota+Corolla+Axio', 0),
  ('f1b1c1d1-0000-0000-0000-000000000007', 'e1b1c1d1-0000-0000-0000-000000000013', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Toyota+Land+Cruiser', 0),
  ('f1b1c1d1-0000-0000-0000-000000000008', 'e1b1c1d1-0000-0000-0000-000000000015', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Kia+Sorento', 0),
  ('f1b1c1d1-0000-0000-0000-000000000009', 'e1b1c1d1-0000-0000-0000-000000000017', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Hyundai+Tucson', 0),
  ('f1b1c1d1-0000-0000-0000-000000000010', 'e1b1c1d1-0000-0000-0000-000000000019', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Toyota+Vitz', 0),
  ('f1b1c1d1-0000-0000-0000-000000000011', 'e1b1c1d1-0000-0000-0000-000000000021', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Mahindra+Bolero', 0),
  ('f1b1c1d1-0000-0000-0000-000000000012', 'e1b1c1d1-0000-0000-0000-000000000023', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=TVS+Ntorq', 0),
  ('f1b1c1d1-0000-0000-0000-000000000013', 'e1b1c1d1-0000-0000-0000-000000000025', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Toyota+Premio', 0),
  ('f1b1c1d1-0000-0000-0000-000000000014', 'e1b1c1d1-0000-0000-0000-000000000002', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Honda+Vezel', 0),
  ('f1b1c1d1-0000-0000-0000-000000000015', 'e1b1c1d1-0000-0000-0000-000000000004', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Toyota+Aqua', 0),
  ('f1b1c1d1-0000-0000-0000-000000000016', 'e1b1c1d1-0000-0000-0000-000000000006', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Toyota+KDH', 0),
  ('f1b1c1d1-0000-0000-0000-000000000017', 'e1b1c1d1-0000-0000-0000-000000000008', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Mitsubishi+Montero', 0),
  ('f1b1c1d1-0000-0000-0000-000000000018', 'e1b1c1d1-0000-0000-0000-000000000010', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Honda+Dio', 0),
  ('f1b1c1d1-0000-0000-0000-000000000019', 'e1b1c1d1-0000-0000-0000-000000000012', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Suzuki+Alto', 0),
  ('f1b1c1d1-0000-0000-0000-000000000020', 'e1b1c1d1-0000-0000-0000-000000000014', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Tata+Dimo+Batta', 0),
  ('f1b1c1d1-0000-0000-0000-000000000021', 'e1b1c1d1-0000-0000-0000-000000000016', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Nissan+Caravan', 0),
  ('f1b1c1d1-0000-0000-0000-000000000022', 'e1b1c1d1-0000-0000-0000-000000000018', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Yamaha+FZ-S', 0),
  ('f1b1c1d1-0000-0000-0000-000000000023', 'e1b1c1d1-0000-0000-0000-000000000020', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Honda+Civic', 0),
  ('f1b1c1d1-0000-0000-0000-000000000024', 'e1b1c1d1-0000-0000-0000-000000000022', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Suzuki+Celerio', 0),
  ('f1b1c1d1-0000-0000-0000-000000000025', 'e1b1c1d1-0000-0000-0000-000000000024', 'https://dummyimage.com/600x400/2c3e50/ffffff.jpg&text=Daihatsu+Terios', 0)
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;

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
