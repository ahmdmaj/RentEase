# Entity Relationship Diagram (ERD)
## RentEase - Vehicle Rental Marketplace

**Version:** 1.0  
**Status:** Draft  
**Date:** June 2026  
**Database:** PostgreSQL (Supabase)  

---

## 1. Overview

This document defines the complete database schema for the RentEase platform. The schema is designed to be **highly normalized** to prevent data anomalies, enforce data integrity through **Foreign Key constraints**, and most importantly, utilize **PostgreSQL Exclusion Constraints** to provide **database-level double-booking prevention**.

---

## 2. Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    PROFILES ||--o| AUTH_USERS : extends
    PROFILES ||--o{ VEHICLES : "owns"
    PROFILES ||--o{ BOOKINGS : "makes"
    PROFILES ||--o{ OWNER_APPLICATIONS : "submits"

    VEHICLES ||--o{ VEHICLE_IMAGES : "has"
    VEHICLES ||--o{ BOOKINGS : "contains"

    BOOKINGS ||--|| PAYMENTS : "generates"

    PROFILES {
        uuid id PK "References auth.users"
        text role "renter, owner, admin"
        text full_name
        text phone
        text address
        text avatar_url
        timestamptz created_at
    }

    OWNER_APPLICATIONS {
        uuid id PK
        uuid profile_id FK
        text business_name
        text nic_number
        text status "pending, approved, rejected"
        timestamptz submitted_at
    }

    VEHICLES {
        uuid id PK
        uuid owner_id FK
        text make "e.g. Toyota, BMW"
        text model "e.g. Allion, X5"
        int year
        text transmission "Automatic, Manual"
        text fuel_type "Petrol, Diesel, Hybrid"
        int seating_capacity
        text location "City/District"
        float price_per_day
        text description
        boolean is_available
        timestamptz created_at
    }

    VEHICLE_IMAGES {
        uuid id PK
        uuid vehicle_id FK
        text image_url
        int display_order
    }

    BOOKINGS {
        uuid id PK
        uuid vehicle_id FK
        uuid renter_id FK
        date start_date
        date end_date
        float total_price
        text status "pending, approved, rejected, completed, cancelled"
        timestamptz created_at
    }

    PAYMENTS {
        uuid id PK
        uuid booking_id FK
        float amount
        text transaction_id
        text status "pending, success, failed"
        timestamptz created_at
    }