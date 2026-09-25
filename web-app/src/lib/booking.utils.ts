/**
 * Pure business-logic utility functions for bookings.
 * These are used by the UI and are independently unit-testable.
 */

export type BookingStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type UserRole = 'renter' | 'owner' | 'admin';

// ─── Price Calculation ────────────────────────────────────────────────────────

/**
 * Calculates total booking price server-side formula mirrors.
 * (end_date - start_date) * price_per_day
 */
export function calculateBookingPrice(
  startDate: Date,
  endDate: Date,
  pricePerDay: number
): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  const days = diffMs / (1000 * 60 * 60 * 24);
  return days * pricePerDay;
}

// ─── Date Validation ─────────────────────────────────────────────────────────

export type DateValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Mirrors the RPC date validation guards exactly.
 * start_date must be >= today, and end_date must be strictly after start_date.
 */
export function validateBookingDates(
  startDate: Date,
  endDate: Date,
  today: Date = new Date()
): DateValidationResult {
  // Strip time component for pure date comparison
  const todayNorm = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const startNorm = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );
  const endNorm = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );

  if (startNorm < todayNorm) {
    return { valid: false, reason: 'Booking start date cannot be in the past.' };
  }
  if (startNorm >= endNorm) {
    return { valid: false, reason: 'Booking start date must be before end date.' };
  }
  return { valid: true };
}

// ─── State Machine ────────────────────────────────────────────────────────────

/**
 * Returns whether a status transition is permitted for a given role.
 * Mirrors the protect_booking_updates trigger logic.
 */
export function isTransitionAllowed(
  from: BookingStatus,
  to: BookingStatus,
  role: UserRole,
  isVehicleOwner: boolean,
  rentalEndDate: Date,
  today: Date = new Date()
): boolean {
  // Admins can do anything except early completion
  if (role === 'admin') {
    if (to === 'completed') {
      return today >= rentalEndDate;
    }
    return true;
  }

  if (from === 'pending') {
    if (to === 'approved' || to === 'rejected') return isVehicleOwner;
    if (to === 'cancelled') return true; // renter or owner
    return false;
  }

  if (from === 'approved') {
    if (to === 'cancelled') return true; // owner or renter (subject to policy)
    if (to === 'completed') {
      return isVehicleOwner && today >= rentalEndDate;
    }
    return false;
  }

  return false;
}
