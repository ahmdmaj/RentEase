# 🚗 RentEase

### *Peer-to-Peer Vehicle Rental Marketplace*

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Planning-blue?style=for-the-badge)](https://github.com/yourusername/rentease)

---

## 📖 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [The "Double-Booking" Engine (The Magic)](#-the-double-booking-engine-the-magic)
5. [Documentation](#-documentation)
6. [Getting Started](#-getting-started)
7. [Project Roadmap](#-project-roadmap)
8. [Author](#-author)

---

## 📝 Project Overview

**RentEase** is a mobile application that connects private vehicle owners with individuals looking for affordable, convenient transportation. Inspired by platforms like *Ikman.lk* and *Turo*, it allows car, van, and bike owners to list their vehicles for rent, set daily prices, and manage availability. Renters can browse, filter, check real-time availability, and request bookings seamlessly.

**The Problem:** Finding a vehicle to rent in Sri Lanka often involves calling multiple contacts, scrolling through Facebook groups, or physically visiting local garages—a fragmented, time-consuming, and opaque process.

**Our Solution:** RentEase centralizes all available private vehicles into one searchable mobile app, automates availability calendars, prevents double-bookings, and builds trust through an admin-verification system for owners.

> *This project was built as a portfolio showcase to demonstrate full-stack mobile development, database design, and complex business logic implementation.*

---

## ✨ Key Features

### 👤 **Renter**
- Register & Log in (Email/Password + Magic Link)
- Browse vehicles with real-time availability status
- Advanced search & filter (Make, Model, Price, Fuel Type)
- View detailed specs and image galleries
- Select dates & request a booking with automatic price calculation
- View booking history (Upcoming, Active, Completed)

### 🚗 **Vehicle Owner**
- Submit an application to become a verified owner (Admin approval required)
- List vehicles with photos, specs, and daily pricing
- Manage availability (block personal use dates)
- View incoming booking requests and **Approve/Reject** them
- Edit or delete vehicle listings

### 🛡️ **Admin**
- Review & approve/reject owner applications
- View all users, vehicles, and bookings
- Platform analytics (users, bookings, revenue trends)

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React Native (Expo) | Cross-platform mobile app (iOS & Android) |
| **State Management** | Zustand / Context API | Global state (auth, bookings) |
| **Navigation** | React Navigation | Stack & Bottom Tab navigation |
| **Backend (BaaS)** | Supabase | PostgreSQL database, Auth, Storage, Realtime |
| **Database** | PostgreSQL | Relational database with RLS & Exclusion Constraints |
| **Storage** | Supabase Storage | Vehicle images & user avatars |
| **Version Control** | Git & GitHub | Source code management & documentation |
| **Deployment** | Expo EAS Build | APK/IPA generation for demo |

---
huu
## ⚡ The "Double-Booking" Engine (The Magic)

The most critical and impressive technical feature of RentEase is its **database-level double-booking prevention**.

Instead of relying on application code (which can fail in concurrent scenarios), we implemented a **PostgreSQL Exclusion Constraint** that actively prevents overlapping bookings for the same vehicle.

### How it works:
- When a booking is **Approved**, the database stores the date range (`start_date`, `end_date`).
- If a new booking request comes in for the same vehicle, the database automatically checks:
  > *"Does the new date range overlap with any existing 'Approved' booking?"*
- If yes, PostgreSQL throws a **Conflict Error (409)**—the booking is instantly rejected.

### The SQL that makes it possible:
```sql
ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
    vehicle_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
) WHERE (status = 'approved');