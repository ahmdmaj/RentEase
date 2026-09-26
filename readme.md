# 🚗 RentEase

<div align="center">
  <strong>A secure, cross-platform peer-to-peer vehicle rental platform.</strong>
</div>
<br />
<div align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</div>

---

## 🏗️ Project Architecture

RentEase is structured as a modern monorepo, separating concerns across dedicated client applications while utilizing a unified, highly secure backend.

- **📱 `mobile-app`**: A React Native (Expo) application serving as the primary touchpoint for end-users (Renters and Owners).
- **🌐 `web-app`**: A React (Vite) frontend optimized for web browsing, booking management, and profile settings.
- **🛡️ `web-admin`**: A strictly gated React (Vite) dashboard dedicated to platform administrators for managing users, approving vehicle listings, and monitoring platform health.
- **🗄️ `backend` (Supabase)**: A powerful PostgreSQL backend utilizing native Row Level Security, Supabase Auth, Storage, and Edge Functions.

---

## 🔐 Security & Data Integrity

RentEase was engineered with a "zero-trust client" philosophy. The UI hides features, but the **database enforces security**.

### 🛡️ Core Security Pipeline
```text
Supabase Auth  →  PostgreSQL RLS  →  Database Triggers  →  Secure RPC  →  Database Constraints
```

- **Strict Row Level Security (RLS)**: Enforces multi-role authorization (Admin, Owner, Renter) directly at the database layer. Users cannot elevate their privileges or tamper with other users' profiles.
- **Double-Submission Protection**: The booking RPC explicitly counts matching pending requests and rejects spam to prevent users from accidently double-booking the same vehicle and dates.
- **Protected Storage Policies**: Vehicle image uploads are locked down. Supabase Storage bucket policies explicitly cross-reference the `public.vehicles` table to prevent arbitrary file uploads, path traversal, and malicious file hosting.

### 📅 Booking Integrity
- **Server-Side Price Calculation**: The booking engine drops permissive `INSERT` policies entirely. All bookings route through a `SECURITY DEFINER` RPC (`check_and_create_booking`) which securely calculates pricing on the backend, preventing client-side price manipulation.
- **Date Validation**: The RPC enforces strict chronological constraints (`start_date < end_date` and `start_date >= CURRENT_DATE`) to guarantee mathematically impossible or negative-duration bookings cannot enter the system.
- **Concurrency & Double-Booking Prevention**: Utilizes advanced PostgreSQL `EXCLUDE USING gist` constraints on date ranges to mathematically guarantee that a vehicle cannot be double-booked for overlapping approved dates.
- **State Transition Guardrails**: Database triggers block illegal state transitions. For example, an owner cannot manually force an active booking to `completed` before the rental period ends, preventing a bypass of the `gist` double-booking constraint.

### 🚗 Vehicle Lifecycle (Soft Deletion)
```text
Active Vehicle  →  Owner removes listing  →  Inactive Vehicle  →  Historical bookings preserved
```
Vehicles cannot be hard-deleted if they have historical records. Instead, they are marked `is_active = false`, hiding them from search and preventing new bookings, while perfectly preserving historical financial and rental data.

### 🖼️ Storage Mechanism
- **Public Bucket**: Vehicle images are intended for marketplace browsing and are public.
- **Owner-Only Uploads**: Only the authenticated owner of a vehicle record can upload, modify, or delete its images.
- **Restrictions**: 5MB size limit, restricted exclusively to image MIME types (JPEG, PNG, WEBP).
- **UUID Filenames**: Images are generated with UUIDv4 filenames to prevent predictable enumeration or collisions.

---

## ✨ Key Features

### 🧑‍💼 For Renters
- Browse available vehicles by location, make, and price.
- Secure, conflict-free booking system.
- Manage active, pending, and past trips.

### 🚗 For Owners
- List vehicles with dynamic pricing and up to 5 images.
- Approve or reject incoming booking requests.
- Track earnings and vehicle utilization.

### 👑 For Administrators
- Review and approve new vehicle listings to maintain marketplace quality.
- Manage user roles and moderate the platform.
- Monitor overall platform metrics.

---

## 🚀 Local Setup & Quick Start

Follow these steps to run RentEase locally on your machine.

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/rentease.git
cd rentease
```

### 2. Install Dependencies
Run the installation command in each workspace:
```bash
# Mobile App
cd mobile-app && npm install && cd ..

# Web App
cd web-app && npm install && cd ..

# Admin Dashboard
cd web-admin && npm install && cd ..
```

### 3. Database Setup (Supabase)
Ensure you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed.
```bash
# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Push the migrations and seed the database with mock data
supabase db push
```
*(Note: Pushing the seed file will automatically populate the database with the test accounts below).*

### 4. Run the Development Servers
Open separate terminal instances to run the clients:
```bash
# Start the Expo Mobile App
cd mobile-app && npx expo start

# Start the Web App
cd web-app && npm run dev

# Start the Web Admin Dashboard
cd web-admin && npm run dev
```


---

## 🧪 Running Tests

The web application includes a unit test suite that validates the core business rules — mirroring the exact logic enforced by the database RPC and triggers.

```bash
cd web-app

# Run all tests once (CI mode)
npm test

# Watch mode (development)
npm run test:watch
```

**Test coverage:**

| Suite | What is tested |
| :--- | :--- |
| `calculateBookingPrice` | Server-side price formula `(end - start) × price_per_day` |
| `validateBookingDates` | Past dates, same-day, reversed-date rejection |
| `isTransitionAllowed (renter)` | Cannot approve, reject, or complete bookings |
| `isTransitionAllowed (owner)` | Cannot complete before rental end date; IDOR check |
| `isTransitionAllowed (admin)` | Admin also blocked from early completion |

**Latest result:** `22 passed / 0 failed`

---



## 🔑 Demo Credentials
To evaluate the platform immediately without going through the signup flow, use the following seeded accounts. **The password for all accounts is `password123`.**

| Role | Email | Description |
| :--- | :--- | :--- |
| **Admin** | `admin@rentease.com` | Full access to the `web-admin` dashboard. |
| **Owner (1)** | `owner1@rentease.com` | Has 2 active vehicles listed with pending bookings. |
| **Owner (2)** | `owner2@rentease.com` | Has 3 active vehicles listed (cars, vans, bikes). |
| **Renter (1)** | `renter1@rentease.com` | Has future pending & rejected bookings. |
| **Renter (2)** | `renter2@rentease.com` | Has currently active (approved) bookings. |
| **Renter (3)** | `renter3@rentease.com` | Has past completed bookings. |

---
<div align="center">
  <i>Engineered for scale, security, and performance.</i>
</div>