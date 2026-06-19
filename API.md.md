# API Reference & Contract
## RentEase - Vehicle Rental Marketplace

**Version:** 1.0  
**Status:** Draft  
**Date:** June 2026  
**Base URL:** `https://<your-project-ref>.supabase.co`  

---

## 1. Introduction

This document defines the API contract between the React Native mobile client and the Supabase backend.

RentEase leverages **two types of API interactions**:

1.  **Supabase Auto-generated REST API**: Used for standard CRUD operations (fetching vehicles, managing profiles, uploading images).
2.  **Custom PostgreSQL RPC Functions**: Used for complex, transactional business logic that requires ACID compliance—specifically, creating a booking while preventing double-booking.

**Authentication:** All requests (except sign-up and sign-in) require a valid JWT access token. Supabase automatically attaches this token to the `Authorization` header.

---

## 2. Authentication Endpoints (Supabase Auth)

These are handled directly by the Supabase Auth service.

| Operation | SDK Method | Description |
| :--- | :--- | :--- |
| Sign Up | `supabase.auth.signUp({ email, password })` | Registers a new user. Auto-creates a profile via DB trigger. |
| Sign In | `supabase.auth.signInWithPassword({ email, password })` | Logs in and returns a JWT access token. |
| Sign Out | `supabase.auth.signOut()` | Invalidates the current session. |
| Reset Password | `supabase.auth.resetPasswordForEmail(email)` | Sends a password reset link to the user's email. |

---

## 3. Standard CRUD Operations (Auto-generated REST)

These are direct table queries using the Supabase client.

### 3.1 Profiles

| Operation | Method | Endpoint / Client Call | Description |
| :--- | :--- | :--- | :--- |
| Get Self | `SELECT` | `supabase.from('profiles').select('*').eq('id', userId)` | Fetch the logged-in user's profile. |
| Update Self | `UPDATE` | `supabase.from('profiles').update({ full_name, phone }).eq('id', userId)` | Update profile fields. |

---

### 3.2 Owner Applications

| Operation | Method | Client Call | Description |
| :--- | :--- | :--- | :--- |
| Submit Application | `INSERT` | `supabase.from('owner_applications').insert({ profile_id, business_name, nic_number })` | Apply to become a vehicle owner. |
| Get My Applications | `SELECT` | `supabase.from('owner_applications').select('*').eq('profile_id', userId)` | Check application status. |
| Admin: Get All Pending | `SELECT` | `supabase.from('owner_applications').select('*, profiles(*))').eq('status', 'pending')` | Admin dashboard view. |
| Admin: Update Status | `UPDATE` | `supabase.from('owner_applications').update({ status: 'approved' }).eq('id', appId)` | Approve or reject applications. |

---

### 3.3 Vehicles

| Operation | Method | Client Call | Description |
| :--- | :--- | :--- | :--- |
| List All Vehicles | `SELECT` | `supabase.from('vehicles').select('*, profiles(full_name)').eq('is_available', true)` | Home screen feed. Supports filters. |
| Filter Vehicles | `SELECT` | `supabase.from('vehicles').select('*').ilike('make', '%Toyota%').gte('price_per_day', 1000).lte('price_per_day', 5000)` | Search and filter logic. |
| Get Vehicle Details | `SELECT` | `supabase.from('vehicles').select('*, vehicle_images(*)').eq('id', vehicleId).single()` | Detail screen with images. |
| Create Vehicle | `INSERT` | `supabase.from('vehicles').insert({ owner_id, make, model, price_per_day, ... })` | Owner adds a new listing. |
| Update Vehicle | `UPDATE` | `supabase.from('vehicles').update({ price_per_day, description }).eq('id', vehicleId).eq('owner_id', userId)` | Owner edits their listing. |
| Delete Vehicle | `DELETE` | `supabase.from('vehicles').delete().eq('id', vehicleId).eq('owner_id', userId)` | Owner removes listing. |

---

### 3.4 Vehicle Images

| Operation | Method | Client Call | Description |
| :--- | :--- | :--- | :--- |
| Upload Image | `Storage` | `supabase.storage.from('vehicle-images').upload(path, file)` | Uploads image to bucket. |
| Get Public URL | `Storage` | `supabase.storage.from('vehicle-images').getPublicUrl(path).data.publicUrl` | Generates the final URL to save in `vehicle_images` table. |
| Insert Image Record | `INSERT` | `supabase.from('vehicle_images').insert({ vehicle_id, image_url, display_order })` | Save the URL to the database. |
| Delete Image | `DELETE` | `supabase.from('vehicle_images').delete().eq('id', imageId)` | Remove image record and delete from storage. |

---

### 3.5 Payments

| Operation | Method | Client Call | Description |
| :--- | :--- | :--- | :--- |
| Create Payment Log | `INSERT` | `supabase.from('payments').insert({ booking_id, amount, status: 'pending' })` | Log payment initiation. |
| Update Payment Status | `UPDATE` | `supabase.from('payments').update({ status: 'success', transaction_id }).eq('booking_id', bookingId)` | Webhook or admin updates. |

---

## 4. ⭐ Custom RPC Function (The Magic)

This function is the core of the RentEase business logic. It handles the entire booking workflow in a **single database transaction** to ensure data consistency.

### 4.1 Function: `check_and_create_booking`

**Purpose:** 
- Validates that the requested date range does not overlap with an existing `approved` booking.
- If valid, inserts the booking with a `pending` status.
- Returns the newly created booking ID or an error.

**PostgreSQL Definition:**

```sql
CREATE OR REPLACE FUNCTION check_and_create_booking(
    p_vehicle_id UUID,
    p_renter_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_overlap_count INT;
    v_price_per_day FLOAT;
    v_total_price FLOAT;
    v_new_booking_id UUID;
BEGIN
    -- 1. Retrieve the vehicle price
    SELECT price_per_day INTO v_price_per_day
    FROM vehicles
    WHERE id = p_vehicle_id;

    IF v_price_per_day IS NULL THEN
        RAISE EXCEPTION 'Vehicle not found';
    END IF;

    -- 2. Check for overlapping approved bookings
    SELECT COUNT(*) INTO v_overlap_count
    FROM bookings
    WHERE vehicle_id = p_vehicle_id
      AND status = 'approved'
      AND daterange(start_date, end_date, '[)') && daterange(p_start_date, p_end_date, '[)');

    -- 3. If overlap found, rollback by throwing an error
    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'Vehicle is already booked for the selected dates.';
    END IF;

    -- 4. Calculate total price (number of days * price_per_day)
    v_total_price := EXTRACT(DAY FROM (p_end_date - p_start_date)) * v_price_per_day;

    -- 5. Insert the booking (status = 'pending')
    INSERT INTO bookings (
        vehicle_id,
        renter_id,
        start_date,
        end_date,
        total_price,
        status
    ) VALUES (
        p_vehicle_id,
        p_renter_id,
        p_start_date,
        p_end_date,
        v_total_price,
        'pending'
    )
    RETURNING id INTO v_new_booking_id;

    -- 6. Return success payload
    RETURN jsonb_build_object(
        'success', TRUE,
        'booking_id', v_new_booking_id,
        'total_price', v_total_price,
        'status', 'pending'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM
        );
END;
$$;