import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyMortgage,
  calculateMedian,
  deriveAffordabilityLocally,
  MORTGAGE_CONSTANTS,
} from '@/lib/calculations';
import type { ResaleTransaction } from '@/types';

// ─── calculateMonthlyMortgage ─────────────────────────────────────────────────

describe('calculateMonthlyMortgage', () => {
  it('returns a positive value for a standard principal', () => {
    expect(calculateMonthlyMortgage(390_000)).toBeGreaterThan(0);
  });

  it('returns approximately S$1,770 for S$390k at 2.6% over 25 years', () => {
    expect(calculateMonthlyMortgage(390_000)).toBeCloseTo(1770, -1);
  });

  it('scales linearly with principal', () => {
    const single = calculateMonthlyMortgage(200_000);
    const double = calculateMonthlyMortgage(400_000);
    expect(double).toBeCloseTo(single * 2, 0);
  });
});

// ─── calculateMedian ──────────────────────────────────────────────────────────

describe('calculateMedian', () => {
  it('returns null for an empty array', () => {
    expect(calculateMedian([])).toBeNull();
  });

  it('returns the only value in a single-element array', () => {
    expect(calculateMedian([600_000])).toBe(600_000);
  });

  it('returns middle value for odd-length sorted array', () => {
    expect(calculateMedian([400_000, 500_000, 600_000])).toBe(500_000);
  });

  it('averages two middle values for even-length array', () => {
    expect(calculateMedian([400_000, 500_000, 600_000, 700_000])).toBe(550_000);
  });

  it('sorts correctly before computing median', () => {
    expect(calculateMedian([700_000, 400_000, 500_000])).toBe(500_000);
  });

  it('does not mutate the original array', () => {
    const arr = [700_000, 400_000, 500_000];
    calculateMedian(arr);
    expect(arr[0]).toBe(700_000);
  });
});

// ─── deriveAffordabilityLocally ───────────────────────────────────────────────

const makeTransaction = (price: number): ResaleTransaction => ({
  id: 1,
  month: '2024-01',
  town: 'TAMPINES',
  flatType: '4 ROOM',
  block: '123',
  streetName: 'TAMPINES ST 11',
  storeyRange: '07 TO 09',
  floorAreaSqm: 92,
  flatModel: 'New Generation',
  leaseCommenceDate: 1985,
  remainingLease: '60 years',
  resalePrice: price,
});

describe('deriveAffordabilityLocally', () => {
  const transactions = [500_000, 520_000, 480_000].map(makeTransaction);

  it('returns null for empty transactions', () => {
    expect(deriveAffordabilityLocally([], 10_000)).toBeNull();
  });

  it('returns PASS when income is high enough', () => {
    const result = deriveAffordabilityLocally(transactions, 20_000);
    expect(result?.verdict).toBe('PASS');
  });

  it('returns FAIL when income is too low', () => {
    const result = deriveAffordabilityLocally(transactions, 2_000);
    expect(result?.verdict).toBe('FAIL');
  });

  it('uses 75% LTV for loan calculation', () => {
    const result = deriveAffordabilityLocally(transactions, 10_000);
    expect(result?.loanAmount).toBeCloseTo(500_000 * MORTGAGE_CONSTANTS.LTV_RATIO, 0);
  });

  it('MSR is mortgage / income', () => {
    const result = deriveAffordabilityLocally(transactions, 10_000);
    if (!result) throw new Error('result is null');
    const expected = result.monthlyMortgage / 10_000;
    expect(result.msr).toBeCloseTo(expected, 4);
  });

  it('msrExceeded is true when MSR > 0.30', () => {
    const result = deriveAffordabilityLocally(transactions, 3_000);
    expect(result?.msrExceeded).toBe(true);
  });

  it('msrExceeded is false when MSR <= 0.30', () => {
    const result = deriveAffordabilityLocally(transactions, 20_000);
    expect(result?.msrExceeded).toBe(false);
  });

  it('explanation string contains msrPercent', () => {
    const result = deriveAffordabilityLocally(transactions, 10_000);
    expect(result?.explanation).toContain(String(result?.msrPercent));
  });
});
