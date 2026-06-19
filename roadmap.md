# Development Roadmap
## RentEase - Vehicle Rental Marketplace

**Version:** 1.0  
**Status:** Draft  
**Date:** June 2026  

---

## 1. Overview

This document outlines the phased development plan for RentEase. The project is divided into three distinct phases:

- **Phase 1 (MVP):** Core functionality — authentication, vehicle browsing, and the critical booking engine.
- **Phase 2 (V1):** Enhanced features — payments, push notifications, and admin dashboard.
- **Phase 3 (V2):** Polish and scale — reviews, maps, advanced analytics, and AI recommendations.

The goal is to deliver a **production-ready, showcase-quality MVP** within 4–6 weeks, with subsequent phases as stretch goals.

---

## 2. Phase 1: Minimum Viable Product (MVP)

**Timeline:** Week 1 – Week 4  
**Goal:** A functional, self-contained vehicle rental app that demonstrates the core business logic (double-booking prevention) and end-to-end user flow.

### 2.1 Setup & Infrastructure (Week 1)

| Task | Description | Status |
| :--- | :--- | :--- |
| Initialize GitHub Repository | Create repo, set up folder structure, branch protection rules. | [ ] |
| Setup Supabase Project | Create project, configure database, set up authentication (email/password). | [ ] |
| Write RLS Policies | Implement security policies for all tables. | [ ] |
| Create PostgreSQL Functions | Write `check_and_create_booking` RPC function. | [ ] |
| Expo Setup | Initialize React Native project with TypeScript, install dependencies (Supabase SDK, React Navigation, Zustand). | [ ] |
| Environment Variables | Create `.env.example` and configure Supabase URL/ANON keys. | [ ] |

**Deliverable:** Project scaffolding complete; Supabase database and RLS ready.

---

### 2.2 Authentication Module (Week 2)

| Task | Description | Status |
| :--- | :--- | :--- |
| Sign Up Screen | UI for email/password registration with validation. | [ ] |
| Sign In Screen | UI for login with error handling (invalid credentials). | [ ] |
| Password Reset | Forgot password screen with Supabase integration. | [ ] |
| Auth Context | Global state management for user session (Zustand/Context). | [ ] |
| Protected Routes | Implement navigation guards for screens requiring authentication. | [ ] |
| Profile Screen | View and edit basic profile details (name, phone). | [ ] |
| Role Assignment | Auto-assign `renter` role on signup via database trigger. | [ ] |

**Deliverable:** Users can register, log in, and manage their profile.

---

### 2.3 Vehicle Browsing (Week 3)

| Task | Description | Status |
| :--- | :--- | :--- |
| Vehicle List Screen | Home screen displaying all available vehicles (`is_available = true`). | [ ] |
| Vehicle Card Component | Reusable card showing thumbnail, make, model, price, and location. | [ ] |
| Search Functionality | Search by make/model using `ilike` queries. | [ ] |
| Filter Options | Filter by vehicle type, fuel type, and price range. | [ ] |
| Vehicle Detail Screen | Full spec page with images, description, price, and "Book Now" button. | [ ] |
| Image Carousel | Swipeable image gallery for vehicle photos. | [ ] |
| Availability Indicator | Show "Available" or "Unavailable" based on existing bookings. | [ ] |

**Deliverable:** Users can browse, search, and view vehicle details.

---

### 2.4 Core Booking Engine (Week 4) ⭐ (The "Wow" Feature)

| Task | Description | Status |
| :--- | :--- | :--- |
| Date Selection UI | Integrate a date picker for start/end dates. | [ ] |
| Price Calculator | Display dynamic total price as dates are selected. | [ ] |
| Booking Request Submission | Call `check_and_create_booking` RPC function. | [ ] |
| Overlap Handling | Show user-friendly error when dates are unavailable. | [ ] |
| Booking History Screen | List all user bookings with status (pending, approved, rejected). | [ ] |
| Booking Detail Screen | View specific booking details with status and payment info. | [ ] |
| Owner Approval UI | Owners can view pending bookings for their vehicles and approve/reject. | [ ] |
| Booking Cancellation | Renters can cancel their `pending` bookings. | [ ] |

**Deliverable:** Full booking cycle — request, approve/reject, and cancellation.

---

### 2.5 Owner Application & Admin (MVP Wrap-up)

| Task | Description | Status |
| :--- | :--- | :--- |
| Owner Application Form | Users can submit business name and NIC to apply to become an owner. | [ ] |
| Admin Dashboard (Web/Simple) | View pending applications and approve/reject. | [ ] |
| Owner Management | Admin can toggle user role between `renter` and `owner`. | [ ] |
| Vehicle Listing Form | Owners can add new vehicles with images (Supabase Storage). | [ ] |
| My Listings Screen | Owners can view, edit, or delete their own vehicles. | [ ] |
| Polish & Testing | End-to-end testing, edge cases, bug fixes, and UI polish. | [ ] |

**Deliverable:** MVP complete — a fully functional vehicle rental marketplace.

---

### ✅ MVP Success Criteria Checklist

- [ ] A renter can sign up, log in, and browse vehicles.
- [ ] A renter can select dates and book a vehicle.
- [ ] The system rejects overlapping bookings.
- [ ] An owner receives booking requests and can approve/reject.
- [ ] An admin can approve/reject owner applications.
- [ ] The app runs without crashes on both iOS and Android simulators.

---

## 3. Phase 2: Version 1.0 (V1)

**Timeline:** Week 5 – Week 7  
**Goal:** Add payment integration, notifications, and a polished admin dashboard to make the app "market-ready."

### 3.1 Payment Integration

| Task | Description |
| :--- | :--- |
| Payment Gateway Setup | Integrate Stripe/PayPal SDK (sandbox mode). |
| Pay Now Flow | Renters can pay immediately upon booking or after approval. |
| Payment Status Sync | Update `payments` table with transaction status. |
| Invoice Generation | Generate and display a simple invoice/confirmation screen. |

### 3.2 Push Notifications

| Task | Description |
| :--- | :--- |
| Expo Notifications Setup | Configure push notification tokens. |
| Owner Notification | Notify owner when a new booking request is received. |
| Renter Notification | Notify renter when their booking is approved/rejected. |
| Scheduled Reminders | Remind renters 1 day before pickup to return the vehicle. |

### 3.3 Advanced Admin Dashboard

| Task | Description |
| :--- | :--- |
| User Analytics | View total users, active vs. inactive. |
| Booking Analytics | View daily/monthly booking trends and revenue. |
| Vehicle Analytics | View most popular vehicles (by booking count). |
| Report Export | Export CSV reports for bookings and payments. |

### ✅ V1 Success Criteria

- [ ] Renters can pay for bookings via Stripe sandbox.
- [ ] Push notifications are sent for key events.
- [ ] Admin has a real-time analytics dashboard.

---

## 4. Phase 3: Version 2.0 (V2)

**Timeline:** Week 8+ (Stretch goals)  
**Goal:** Enhance trust, engagement, and usability.

### 4.1 Reviews & Ratings

| Task | Description |
| :--- | :--- |
| Rating System | Renters rate owners/vehicles after booking completion. |
| Review Display | Show average rating on vehicle cards and detail screens. |
| Owner Score | Owners can see their overall rating and respond to reviews. |

### 4.2 Maps Integration

| Task | Description |
| :--- | :--- |
| Google Maps SDK | Display vehicle location on a map. |
| Location-based Search | Filter vehicles by proximity to the user's current location. |
| Pickup/Drop-off Points | Owners can set specific pickup locations on the map. |

### 4.3 AI Recommendations (Showcase Feature)

| Task | Description |
| :--- | :--- |
| Collaborative Filtering | Suggest vehicles based on the user's booking history and similar users' preferences. |
| Dynamic Pricing | Suggest optimal daily prices based on demand (similar to Uber surge pricing). |

### 4.4 Cross-Platform Web Admin

| Task | Description |
| :--- | :--- |
| React Web Dashboard | Build a web-based admin portal (instead of relying on the Supabase SQL Editor). |
| Role-Based Access | Separate dashboards for Admins, Owners, and Renters. |

### ✅ V2 Success Criteria

- [ ] Users can see and leave ratings for vehicles.
- [ ] Vehicles are visible on an interactive map.
- [ ] The app has basic AI-driven recommendations.

---

## 5. Visual Timeline (Gantt Chart Style)

```mermaid
gantt
    title RentEase Development Timeline
    dateFormat  YYYY-MM-DD
    axisFormat %b %d

    section Phase 1 (MVP)
    Setup & Infrastructure      :a1, 2026-07-01, 7d
    Authentication              :a2, after a1, 7d
    Vehicle Browsing            :a3, after a2, 7d
    Booking Engine              :a4, after a3, 7d
    Owner Application & Admin   :a5, after a4, 5d

    section Phase 2 (V1)
    Payment Integration         :b1, after a5, 10d
    Push Notifications          :b2, after b1, 7d
    Admin Analytics             :b3, after b2, 4d

    section Phase 3 (V2)
    Reviews & Ratings           :c1, after b3, 10d
    Maps Integration            :c2, after c1, 10d
    AI Recommendations          :c3, after c2, 10d
    Web Admin Portal            :c4, after c3, 7d