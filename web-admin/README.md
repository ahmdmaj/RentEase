# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
Listed directory c0869729-dd80-40dc-b8c6-a5e95747f582
Listed directory RentEase
Listed directory src
Listed directory pages
Listed directory screens
Listed directory src
Listed directory components
Listed directory components
Listed directory store
Listed directory services
Listed directory context
Viewed roadmap.md:1-224
Listed directory navigation
Viewed App.tsx:1-34
Viewed appNavigator.tsx:1-66
Viewed readme.md:1-96


### 🖥️ 1. Web Admin Portal (`web-admin`)
*Built with React, TypeScript, React Router v6, and responsive custom CSS.*

#### **Authentication & Security**
* **`AuthContext.tsx` & Global State:** Manages administrative session state (`user`, `session`, `loading`) across the web app.
* **`ProtectedRoute.tsx`:** Route guard that intercepts unauthenticated users and redirects them to `/login`.
* **`Login.tsx` (`/login`):** Modern administrator login portal with error handling and secure session establishment.

#### **Navigation & Shell**
* **`Layout.tsx`:** Responsive sidebar navigation and header layout wrapping all protected administrative views with active tab highlighting and quick log out.

#### **Core Administrative Modules**
* **`Dashboard.tsx` (`/`):**
  * High-level analytics overview summarizing key metrics across the platform.
  * Real-time counters for **Total Users**, **Active Bookings**, **Listed Vehicles**, and **Pending Owner Approvals**.
* **`OwnerApprovals.tsx` (`/approvals`):**
  * Dedicated verification queue for users applying to become vehicle owners.
  * Displays applicant identity details (`NIC`/ID details, business name, and contact information).
  * Provides one-click **Approve** (upgrading user role to `owner`) and **Reject** actions.
* **`Users.tsx` (`/users`):**
  * Complete user management directory showing all registered platform users.
  * Filter and search capabilities by role (`renter`, `owner`, `admin`) and status.
* **`Vehicles.tsx` (`/vehicles`):**
  * Global fleet inventory overview allowing admins to audit every listed vehicle on the platform.
  * Displays vehicle specs, pricing, availability status, and owner associations, with the ability to take down non-compliant listings.
* **`Bookings.tsx` (`/bookings`):**
  * Platform-wide transaction and booking monitor.
  * Tracks booking date ranges (`start_date` -> `end_date`), total cost calculations, and lifecycle status (`pending`, `approved`, `rejected`, `cancelled`).

---

### 📱 2. Mobile Application (`mobile-app`)
*Built with React Native (Expo), TypeScript, NativeStack Navigation, Zustand, and Supabase SDK.*

#### **Authentication & Profile Management**
* **`authStore.ts`:** Zustand-powered persistent authentication store handling session hydration and token management.
* **`LoginScreen.tsx` & `SignupScreen.tsx`:**
  * Clean registration and login flows with form validation and error notifications.
  * Automatically initializes users with the `renter` role upon registration.
* **`ForgotPasswordScreen.tsx`:** Password recovery screen hooked into Supabase auth reset flow.
* **`ProfileScreen.tsx` (`Profile`):**
  * View and update personal profile details (Name, Phone number, Email).
  * Allows renters to submit their **Owner Verification Application** directly from the app.
  * Sign out functionality.

#### **Renter Experience (Browsing & Booking)**
* **`HomeScreen.tsx` (`Home`):**
  * Unified discovery hub displaying all available vehicles (`is_available = true`).
  * **Search & Filters:** Real-time search by Make/Model alongside filtering options by vehicle category (Car, Van, Bike), fuel type, transmission, and daily price.
  * **Vehicle Cards:** Clean visual cards highlighting vehicle thumbnails, daily rate, location, and ratings.
* **`VehicleDetailScreenRenter.tsx` (`VehicleDetail`):**
  * Full specification view showcasing image carousels, technical features, seating capacity, owner information, and pricing details.
  * Direct action button to initiate the booking flow.
* **`BookingScreen.tsx` (`Booking`):**
  * **Interactive Date Picker:** Allows renters to select start and end rental dates.
  * **Dynamic Price Calculator:** Automatically computes the total rental cost (`days * daily_rate`) in real time.
  * **Exclusion & Overlap Protection:** Submits the booking request while interfacing with PostgreSQL's exclusion constraints (`no_overlapping_bookings`) to prevent double-booking conflicts.
* **`MyBookingsScreen.tsx` (`MyBookings`):**
  * Personal trip management screen categorized by status tabs (`Pending`, `Approved`, `Rejected`, `Cancelled`).
  * Enables renters to cancel active `pending` booking requests.

#### **Owner Experience (Fleet & Request Management)**
* **`MyListingsScreen.tsx` (`MyListings`):**
  * Dashboard for verified vehicle owners to oversee all vehicles currently listed under their profile.
  * Quick status indicators and navigation to edit or add new inventory.
* **`AddVehicleScreen.tsx` (`AddVehicle`) & `DropdownPicker.tsx`:**
  * Comprehensive multi-step vehicle listing form.
  * **Supabase Storage Integration:** Supports uploading vehicle images directly from the camera or photo library.
  * Structured input fields for Make, Model, Year, Transmission, Fuel Type, Daily Rate, Location, and detailed descriptions using custom dropdown selectors.
* **`EditVehicleScreen.tsx` (`EditVehicle`):**
  * Allows owners to update vehicle information, modify daily rates, toggle vehicle availability (`Available` vs `Unavailable`), or delete listings.
* **`OwnerBookingsScreen.tsx` (`OwnerBookings`):**
  * Dedicated inbox for vehicle owners to review incoming booking requests from renters.
  * Displays requested dates, renter contact details, and dynamic total payouts.
  * Provides **Approve** and **Reject** action buttons (where approving locks in the dates at the database level).

#### **Notifications & System Activity**
* **`NotificationsScreen.tsx` (`Notifications`):**
  * Activity feed alerting users to important events (e.g., *Booking Approved*, *New Booking Request Received*, *Owner Application Approved*).

---

### 🛡️ 3. Database & Backend Engine (`supabase/`)
* **Role-Based Access Control (RLS):** Policies protecting user profiles, vehicle listings, and bookings so users can only modify their own records while admins have overarching review permissions.
* **Anti-Double-Booking Constraint (`EXCLUDE USING gist`):** A PostgreSQL exclusion constraint configured on `bookings` ensuring no two `approved` bookings can occupy overlapping date ranges (`daterange(start_date, end_date, '[)') WITH &&`) for the same `vehicle_id`.