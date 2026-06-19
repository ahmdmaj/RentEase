# Git Workflow & Repository Structure
## RentEase - Vehicle Rental Marketplace

**Version:** 1.0  
**Status:** Draft  
**Date:** June 2026  

---

## 1. Overview

This document defines the Git branching strategy, commit conventions, pull request guidelines, and repository folder structure for the RentEase project.

**Goal:** Maintain a clean, readable, and professional Git history that showcases disciplined development practices to recruiters and collaborators.

---

## 2. Branching Strategy (GitFlow Simplified)

We adopt a **simplified GitFlow** model. Since this is a solo project (or small team), we keep it lean but professional.

### 2.1 Core Branches

| Branch | Name | Purpose |
| :--- | :--- | :--- |
| `main` | Production | The most stable branch. Contains only production-ready, tested code. |
| `develop` | Integration | The main development branch. All feature branches are merged here. |

### 2.2 Supporting Branches

| Branch Type | Naming Pattern | Purpose |
| :--- | :--- | :--- |
| Feature | `feature/short-description` | For new features (e.g., `feature/vehicle-listing`, `feature/booking-engine`). |
| Bugfix | `bugfix/short-description` | For fixing bugs identified during development. |
| Hotfix | `hotfix/short-description` | For critical production fixes branched directly from `main`. |
| Release | `release/vX.X.X` | For preparing a new release (final testing, version bumps). |

### 2.3 Branching Flow Diagram

```mermaid
gitGraph
    commit id: "Initial commit"
    branch develop
    checkout develop
    commit id: "Setup Supabase client"
    branch feature/auth
    commit id: "Add signup screen"
    commit id: "Add login logic"
    checkout develop
    merge feature/auth
    branch feature/vehicle-listing
    commit id: "Add vehicle card UI"
    commit id: "Fetch vehicles from Supabase"
    checkout develop
    merge feature/vehicle-listing
    branch feature/booking-engine
    commit id: "Add RPC call function"
    commit id: "Build booking form"
    checkout develop
    merge feature/booking-engine
    checkout main
    merge develop tag: "v1.0.0"