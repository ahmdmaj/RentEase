# System Architecture Document
## RentEase - Vehicle Rental Marketplace

**Version:** 1.0  
**Status:** Draft  
**Date:** June 2026  

---

## 1. Introduction

This document describes the high-level system architecture for the RentEase mobile application. It outlines the core components, their interactions, and the specific flow of data for critical business operations (specifically, preventing double-bookings).

---

## 2. High-Level System Architecture

The system follows a **Client-Server** architecture leveraging **Backend-as-a-Service (BaaS)**. This approach minimizes server maintenance overhead while providing enterprise-grade scalability through Supabase.

### 2.1 Component Overview

```mermaid
flowchart TB
    subgraph Client ["Mobile Client (React Native / Expo)"]
        UI["User Interface Screens"]
        State["State Management (Context/Zustand)"]
        SDK["Supabase JavaScript SDK"]
    end

    subgraph Backend ["Supabase Platform (BaaS)"]
        Auth["Auth Service (JWT)"]
        DB["PostgreSQL Database"]
        Storage["Storage Buckets (Images)"]
        RPC["PostgreSQL Functions (RPC)"]
        Realtime["Realtime WebSockets"]
    end

    UI <--> State
    State <--> SDK
    SDK <--> Auth
    SDK <--> DB
    SDK <--> Storage
    SDK <--> RPC
    SDK <--> Realtime