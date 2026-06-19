3. Table Definitions (DDL)
3.1 profiles
Note: In Supabase, this table is automatically populated via a trigger when a new user signs up in auth.users.

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'renter' CHECK (role IN ('renter', 'owner', 'admin')),
    full_name TEXT,
    phone TEXT,
    address TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Users can read/update only their own profile. Admins can read all.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

3.2 owner_applications
CREATE TABLE owner_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_name TEXT,
    nic_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Users can insert/select their own applications. Admins can update status.
ALTER TABLE owner_applications ENABLE ROW LEVEL SECURITY;

3.3 vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INT,
    transmission TEXT CHECK (transmission IN ('Automatic', 'Manual')),
    fuel_type TEXT CHECK (fuel_type IN ('Petrol', 'Diesel', 'Hybrid', 'Electric')),
    seating_capacity INT,
    location TEXT NOT NULL,
    price_per_day FLOAT NOT NULL CHECK (price_per_day > 0),
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Public read. Only the owner can insert/update/delete.
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

3.4 vehicle_images
CREATE TABLE vehicle_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0
);

-- RLS: Public read. Only the vehicle owner can manage.
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;

3.5 payments

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount FLOAT NOT NULL,
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;


3.6 ⭐ bookings (The Critical Table)
This table contains the magic. We enforce business rules at the database level.

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price FLOAT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Business Rule: Start date must be before End date
    CHECK (start_date < end_date)
);

-- ============================================================
-- 🔥 THE DOUBLE-BOOKING PREVENTION (Exclusion Constraint)
-- ============================================================
-- This is the crown jewel of the architecture.
-- It prevents ANY two 'approved' bookings from overlapping
-- for the same vehicle_id.
-- ============================================================
ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
    vehicle_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
) WHERE (status = 'approved');

-- Explanation:
-- 'daterange' creates a date range from start_date to end_date.
-- The '&&' operator means "overlaps".
-- The 'WHERE' clause ensures this constraint only applies to APPROVED bookings.
-- If a new APPROVED booking overlaps, PostgreSQL throws a conflict error.
-- ============================================================

-- RLS: Renters see their own bookings. Owners see bookings for their vehicles.
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

5. Indexing Strategy (Performance)
To ensure the app performs well as data grows, we will add the following indexes:

-- For searching vehicles by make/model
CREATE INDEX idx_vehicles_make_model ON vehicles (make, model);

-- For filtering by price and location
CREATE INDEX idx_vehicles_price_location ON vehicles (price_per_day, location);

-- Critical: Speeds up the exclusion constraint and availability checks
CREATE INDEX idx_bookings_vehicle_dates ON bookings (vehicle_id, start_date, end_date) WHERE status = 'approved';

-- For renter history queries
CREATE INDEX idx_bookings_renter_id ON bookings (renter_id);

