import { describe, it, expect } from 'vitest';
import {
  calculateBookingPrice,
  validateBookingDates,
  isTransitionAllowed,
} from '../lib/booking.utils';

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — Price Calculation
// Mirrors: RPC line "v_total_price := (p_end_date - p_start_date) * v_price_per_day"
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateBookingPrice', () => {
  it('calculates correct price for a 3-day booking', () => {
    const start = new Date('2027-01-01');
    const end = new Date('2027-01-04');
    expect(calculateBookingPrice(start, end, 1000)).toBe(3000);
  });

  it('calculates correct price for a 1-day booking', () => {
    const start = new Date('2027-06-01');
    const end = new Date('2027-06-02');
    expect(calculateBookingPrice(start, end, 500)).toBe(500);
  });

  it('returns 0 for same start and end date (matches DB rejection)', () => {
    const d = new Date('2027-03-10');
    expect(calculateBookingPrice(d, d, 999)).toBe(0);
  });

  it('returns negative for reversed dates (mirrors DB rejection)', () => {
    const start = new Date('2027-05-10');
    const end = new Date('2027-05-07');
    expect(calculateBookingPrice(start, end, 500)).toBeLessThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — Date Validation
// Mirrors: RPC guards p_start_date >= p_end_date and p_start_date < CURRENT_DATE
// ─────────────────────────────────────────────────────────────────────────────
describe('validateBookingDates', () => {
  const TODAY = new Date('2027-01-15');

  it('accepts a valid future booking', () => {
    const result = validateBookingDates(
      new Date('2027-01-20'),
      new Date('2027-01-23'),
      TODAY
    );
    expect(result.valid).toBe(true);
  });

  it('rejects same-day start and end (zero-duration)', () => {
    const result = validateBookingDates(
      new Date('2027-01-20'),
      new Date('2027-01-20'),
      TODAY
    );
    expect(result.valid).toBe(false);
    expect((result as { valid: false; reason: string }).reason).toMatch(
      /before end date/i
    );
  });

  it('rejects reversed dates (negative duration)', () => {
    const result = validateBookingDates(
      new Date('2027-01-25'),
      new Date('2027-01-20'),
      TODAY
    );
    expect(result.valid).toBe(false);
    expect((result as { valid: false; reason: string }).reason).toMatch(
      /before end date/i
    );
  });

  it('rejects a start date in the past', () => {
    const result = validateBookingDates(
      new Date('2027-01-10'), // before TODAY
      new Date('2027-01-20'),
      TODAY
    );
    expect(result.valid).toBe(false);
    expect((result as { valid: false; reason: string }).reason).toMatch(
      /past/i
    );
  });

  it('accepts booking starting today', () => {
    const result = validateBookingDates(
      new Date('2027-01-15'),
      new Date('2027-01-16'),
      TODAY
    );
    expect(result.valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — State Machine / Transition Rules
// Mirrors: protect_booking_updates trigger in migration 010
// ─────────────────────────────────────────────────────────────────────────────
describe('isTransitionAllowed — renter', () => {
  const FUTURE = new Date('2099-12-31');
  const PAST = new Date('2000-01-01');

  it('renter can cancel their own pending booking', () => {
    expect(
      isTransitionAllowed('pending', 'cancelled', 'renter', false, FUTURE)
    ).toBe(true);
  });

  it('renter cannot approve their own booking', () => {
    expect(
      isTransitionAllowed('pending', 'approved', 'renter', false, FUTURE)
    ).toBe(false);
  });

  it('renter cannot reject a booking', () => {
    expect(
      isTransitionAllowed('pending', 'rejected', 'renter', false, FUTURE)
    ).toBe(false);
  });

  it('renter cannot mark booking as completed', () => {
    expect(
      isTransitionAllowed('approved', 'completed', 'renter', false, PAST)
    ).toBe(false);
  });
});

describe('isTransitionAllowed — owner', () => {
  const FUTURE = new Date('2099-12-31');
  const PAST = new Date('2000-01-01');

  it('owner can approve a pending booking', () => {
    expect(
      isTransitionAllowed('pending', 'approved', 'owner', true, FUTURE)
    ).toBe(true);
  });

  it('owner can reject a pending booking', () => {
    expect(
      isTransitionAllowed('pending', 'rejected', 'owner', true, FUTURE)
    ).toBe(true);
  });

  it('owner cannot complete an approved booking before rental end date', () => {
    expect(
      isTransitionAllowed('approved', 'completed', 'owner', true, FUTURE)
    ).toBe(false);
  });

  it('owner can complete a booking after rental end date', () => {
    expect(
      isTransitionAllowed('approved', 'completed', 'owner', true, PAST)
    ).toBe(true);
  });

  it('non-owner cannot approve a booking (IDOR check)', () => {
    expect(
      isTransitionAllowed('pending', 'approved', 'owner', false, FUTURE)
    ).toBe(false);
  });
});

describe('isTransitionAllowed — admin', () => {
  const FUTURE = new Date('2099-12-31');
  const PAST = new Date('2000-01-01');

  it('admin can approve any booking', () => {
    expect(
      isTransitionAllowed('pending', 'approved', 'admin', false, FUTURE)
    ).toBe(true);
  });

  it('admin can reject any booking', () => {
    expect(
      isTransitionAllowed('pending', 'rejected', 'admin', false, FUTURE)
    ).toBe(true);
  });

  it('admin cannot complete an active booking early', () => {
    expect(
      isTransitionAllowed('approved', 'completed', 'admin', false, FUTURE)
    ).toBe(false);
  });

  it('admin can complete a booking after end date', () => {
    expect(
      isTransitionAllowed('approved', 'completed', 'admin', false, PAST)
    ).toBe(true);
  });
});
