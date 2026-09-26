/**
 * Phase 6 — Live Supabase Integration Tests
 * These tests run against the REAL Supabase project via the anon key.
 * They verify that security controls (RLS, triggers, RPC) actually work.
 *
 * Run with: npm run test:integration
 * (requires network access to supabase.co)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bcpwlbiczdutuycyrgnu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_O6_wYP1lFxkvxvHIiYNCjg_2vdSFd69';
const TEST_EMAIL = 'renter.a.test@rentease.dev';
const TEST_PASSWORD = 'TestPass@123';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let userId: string;
let testVehicleId: string;
let pricePerDay: number;

// ─────────────────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  // Attempt sign in, create account if first run
  let { data, error } = await sb.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error?.message?.includes('Invalid login credentials')) {
    await sb.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: { data: { full_name: 'Alice Renter' } },
    });
    await new Promise((r) => setTimeout(r, 2000));
    ({ data, error } = await sb.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }));
  }

  if (error) throw new Error(`Test setup failed: ${error.message}`);
  userId = data.user!.id;

  // Get a real active vehicle for attack tests
  const { data: vehicles } = await sb
    .from('vehicles')
    .select('id, price_per_day')
    .eq('is_active', true)
    .limit(1);

  testVehicleId = vehicles?.[0]?.id;
  pricePerDay = vehicles?.[0]?.price_per_day;
}, 15000);

// ─────────────────────────────────────────────────────────────────────────────
// TEST A — Role Escalation Attack
// ─────────────────────────────────────────────────────────────────────────────
describe('Security: Role Escalation', () => {
  it('A — renter cannot self-promote to admin via profiles.update', async () => {
    const { data, error } = await sb
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId)
      .select();

    // Either an error is thrown OR the update returns 0 rows (RLS blocks silently)
    const blocked = error !== null || (Array.isArray(data) && data.length === 0) || data === null;
    expect(blocked).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST B — Direct Booking INSERT Attack
// ─────────────────────────────────────────────────────────────────────────────
describe('Security: Direct Booking INSERT Bypass', () => {
  it('B — cannot bypass RPC by inserting directly into bookings table', async () => {
    const { error } = await sb.from('bookings').insert({
      vehicle_id: testVehicleId,
      renter_id: userId,
      start_date: '2027-03-01',
      end_date: '2027-03-05',
      total_price: 1,
      status: 'approved',
    });

    expect(error).not.toBeNull();
    // RLS blocks INSERT entirely — no insert policy exists
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTS C — Invalid Date Attacks via RPC
// ─────────────────────────────────────────────────────────────────────────────
describe('Security: Invalid Date Attacks via RPC', () => {
  it('C1 — same start and end date rejected', async () => {
    const { data } = await sb.rpc('check_and_create_booking', {
      p_vehicle_id: testVehicleId,
      p_start_date: '2027-05-01',
      p_end_date: '2027-05-01',
    });
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/before end date/i);
  });

  it('C2 — reversed dates (end before start) rejected', async () => {
    const { data } = await sb.rpc('check_and_create_booking', {
      p_vehicle_id: testVehicleId,
      p_start_date: '2027-05-10',
      p_end_date: '2027-05-05',
    });
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/before end date/i);
  });

  it('C3 — past date rejected', async () => {
    const { data } = await sb.rpc('check_and_create_booking', {
      p_vehicle_id: testVehicleId,
      p_start_date: '2020-01-01',
      p_end_date: '2020-01-05',
    });
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/past/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST D — Renter Attempts Vehicle Creation
// ─────────────────────────────────────────────────────────────────────────────
describe('Security: Renter Cannot Create Vehicle', () => {
  it('D — renter insert into vehicles table is blocked by RLS', async () => {
    const { error } = await sb.from('vehicles').insert({
      make: 'Toyota',
      model: 'Camry',
      location: 'Colombo',
      price_per_day: 5000,
      is_available: true,
    });
    expect(error).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST E — Profile IDOR
// ─────────────────────────────────────────────────────────────────────────────
describe('Security: Profile IDOR Prevention', () => {
  it('E — reading all profiles returns only own profile (not all users)', async () => {
    const { data } = await sb.from('profiles').select('id, role, full_name');
    // RLS should only return the authenticated user's own profile
    expect(data).not.toBeNull();
    expect(data!.length).toBe(1);
    expect(data![0].id).toBe(userId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST F — Valid Booking + Server-Side Price Integrity
// ─────────────────────────────────────────────────────────────────────────────
describe('Business Logic: Server-Side Price Integrity', () => {
  it('F — valid booking succeeds and total_price equals (days × price_per_day)', async () => {
    const { data } = await sb.rpc('check_and_create_booking', {
      p_vehicle_id: testVehicleId,
      p_start_date: '2027-10-01',
      p_end_date: '2027-10-04', // 3 days
    });

    expect(data.success).toBe(true);
    expect(data.booking_id).toBeDefined();
    expect(data.status).toBe('pending');

    // Server must calculate: 3 * pricePerDay exactly
    const expectedPrice = 3 * pricePerDay;
    expect(data.total_price).toBe(expectedPrice);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST G — Anonymous Booking Attempt
// ─────────────────────────────────────────────────────────────────────────────
describe('Security: Unauthenticated Booking Attempt', () => {
  it('G — anonymous user cannot create a booking via RPC', async () => {
    // Fresh client with no session
    const sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data } = await sbAnon.rpc('check_and_create_booking', {
      p_vehicle_id: testVehicleId,
      p_start_date: '2027-11-01',
      p_end_date: '2027-11-05',
    });

    expect(data.success).toBe(false);
    expect(data.error).toMatch(/authenticated/i);
  });
});
