# Software Requirements Specification (SRS)
## RentEase - Vehicle Rental Marketplace

**Version:** 1.0  
**Status:** Draft  
**Date:** June 2026  
**Author:** [Your Name Here]  

---

## 1. Introduction

### 1.1 Purpose
The purpose of this Software Requirements Specification (SRS) document is to provide a detailed overview of the **RentEase** mobile application. It describes the project's target users, system features, functional and non-functional requirements, and external interfaces. 

This document serves as the foundational blueprint for the development team (and the intern portfolio showcase) to ensure a unified vision before implementation begins.

### 1.2 Scope
**RentEase** is a cross-platform mobile application (React Native) that facilitates peer-to-peer vehicle rentals. It connects vehicle owners with individuals seeking short-term transportation.

The system handles:
- User authentication and role-based access control (Renter, Owner, Admin).
- Vehicle listing management (CRUD operations with image uploads).
- A sophisticated booking engine that prevents date overlaps (double-booking).
- Admin verification workflows for new vehicle owners.

### 1.3 Definitions and Acronyms
| Term | Definition |
| :--- | :--- |
| **BaaS** | Backend-as-a-Service (Supabase). |
| **CRUD** | Create, Read, Update, Delete. |
| **JWT** | JSON Web Token used for secure authentication. |
| **MVP** | Minimum Viable Product. |
| **RLS** | Row Level Security (PostgreSQL policies). |
| **RPC** | Remote Procedure Call (PostgreSQL functions). |

---

## 2. Overall Description

### 2.1 User Characteristics
The system targets three distinct user roles:

1.  **Renter**: A general user looking to browse and book vehicles. Requires no prior approval.
2.  **Vehicle Owner**: A user who lists vehicles for rent. Must be approved by an Admin.
3.  **Administrator**: A super-user responsible for approving new Owners and monitoring platform activity.

### 2.2 Operating Environment
- **Client-side**: iOS and Android devices running the React Native application.
- **Server-side**: Hosted entirely on the Supabase platform (PostgreSQL database, Authentication, Storage, and Realtime services).
- **Network**: Requires a stable internet connection for all operations.

---

## 3. Functional Requirements

### 3.1 User Management & Authentication
| ID | Requirement |
| :--- | :--- |
| **FR-AUTH-01** | The system shall allow new users to register using an email and password. |
| **FR-AUTH-02** | The system shall log users in securely using JWT tokens. |
| **FR-AUTH-03** | The system shall allow users to reset their password via a "Forgot Password" email link. |
| **FR-AUTH-04** | The system shall assign a default `renter` role to all new users upon registration. |

### 3.2 Renter Features (Customer)
| ID | Requirement |
| :--- | :--- |
| **FR-REN-01** | The system shall display a list of available vehicles on the home screen. |
| **FR-REN-02** | The system shall allow renters to search for vehicles by Make (e.g., Toyota) and Model. |
| **FR-REN-03** | The system shall provide filter options for Vehicle Type, Price Range, and Fuel Type. |
| **FR-REN-04** | The system shall display a detailed vehicle view including specifications (year, transmission, seating) and photos. |
| **FR-REN-05** | The system shall allow renters to select a Start Date and End Date. |
| **FR-REN-06** | The system shall automatically calculate the `total_price` (days * price_per_day) before submitting a booking. |
| **FR-REN-07** | The system shall reject a booking request if the selected dates overlap with an existing `APPROVED` booking for the same vehicle. |
| **FR-REN-08** | The system shall allow renters to view a history of their past, upcoming, and pending bookings. |
| **FR-REN-09** | The system shall allow renters to cancel their own `pending` bookings. |

### 3.3 Vehicle Owner Features (Provider)
| ID | Requirement |
| :--- | :--- |
| **FR-OWN-01** | The system shall allow a `renter` to submit an application to become an `owner`. |
| **FR-OWN-02** | The system shall allow verified owners to **Add** a new vehicle listing with details (make, model, year, transmission, fuel, price, location, description). |
| **FR-OWN-03** | The system shall allow owners to upload up to 5 photos per vehicle listing. |
| **FR-OWN-04** | The system shall allow owners to **Edit** or **Delete** their own vehicle listings. |
| **FR-OWN-05** | The system shall allow owners to view all incoming booking requests for their vehicles. |
| **FR-OWN-06** | The system shall allow owners to **Approve** or **Reject** pending booking requests. |
| **FR-OWN-07** | The system shall allow owners to temporarily toggle `is_available` to false to hide their vehicle without deleting it. |

### 3.4 Admin Features
| ID | Requirement |
| :--- | :--- |
| **FR-ADM-01** | The system shall display all `pending` owner applications in an Admin Dashboard. |
| **FR-ADM-02** | The system shall allow the Admin to **Approve** an application (changing the user's role to `owner`). |
| **FR-ADM-03** | The system shall allow the Admin to **Reject** an application with a reason. |
| **FR-ADM-04** | The system shall allow the Admin to view all users, vehicles, and bookings in the system. |

---

## 4. Non-Functional Requirements (NFRs)

| ID | Requirement |
| :--- | :--- |
| **NFR-SEC-01** | **Data Security**: All data must be secured using Supabase RLS policies. A user must never be able to view or modify another user's private data (e.g., an Owner cannot edit another Owner's vehicle). |
| **NFR-SEC-02** | **Authentication**: All API requests (except login/register) must include a valid JWT token. |
| **NFR-PERF-01** | **Performance**: Vehicle listings must load within 2 seconds on a standard 4G connection. |
| **NFR-PERF-02** | **Concurrency**: The booking conflict logic must handle multiple simultaneous booking attempts for the same vehicle without causing a double-booking (handled via database-level locks). |
| **NFR-UX-01** | **Usability**: The mobile UI should follow a clean, minimalist design standard (e.g., Material Design or similar) to ensure intuitive navigation. |
| **NFR-UX-02** | **Feedback**: The app must provide immediate visual feedback (loading spinners, success/error toasts) for all user actions. |

---

## 5. External Interface Requirements

### 5.1 User Interface (UI)
- The interface shall be built using React Native and Expo.
- It must support both iOS and Android screen sizes.
- Navigation shall be implemented using React Navigation (Stack and Bottom Tab navigators).

### 5.2 Hardware Interfaces
- **Camera/Gallery**: The app shall interface with the device's file system to allow users to select and upload vehicle images.

### 5.3 Software Interfaces (Backend)
The mobile app will interact with the backend exclusively via the **Supabase JavaScript SDK**. 

- **Authentication Interface**: Calls to `supabase.auth` for signUp, signIn, and signOut.
- **Database Interface**: Direct queries using `supabase.from('table')` for standard CRUD.
- **Custom Logic Interface**: Calls to `supabase.rpc('function_name')` for complex logic (specifically, the "date overlap" booking validation to ensure ACID compliance).

---

## 6. Future Enhancements (V2)
- **Payments**: Integrate a payment gateway (Stripe/PayPal) to process actual card charges.
- **Push Notifications**: Alert Owners when a new booking is requested, and alert Renters when their booking is approved.
- **Reviews & Ratings**: Allow Renters to rate Owners/Vehicles after a booking is completed.
- **Google Maps Integration**: Show vehicle location on a map.