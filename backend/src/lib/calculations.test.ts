import {
  calculateMedian,
  calculateMonthlyMortgage,
  calculateMSR,
  deriveAffordability,
  MORTGAGE_CONSTANTS,
} from '../lib/calculations';
import type { ResaleTransaction } from '../types';

// ─── calculateMonthlyMortgage ─────────────────────────────────────────────────

describe('calculateMonthlyMortgage', () => {
  const BASE_PARAMS = {
    annualInterestRate: MORTGAGE_CONSTANTS.ANNUAL_INTEREST_RATE,
    loanTermYears: MORTGAGE_CONSTANTS.LOAN_TERM_YEARS,
  };

  test('returns a positive monthly payment for a valid loan', () => {
    const result = calculateMonthlyMortgage({ ...BASE_PARAMS, principalAmount: 390_000 });
    expect(result.monthlyPayment).toBeGreaterThan(0);
  });

  test('monthly payment is approximately correct for a S$390k loan at 2.6% over 25yr', () => {
    // Hand-verified: ~S$1,770/month
    const result = calculateMonthlyMortgage({ ...BASE_PARAMS, principalAmount: 390_000 });
    expect(result.monthlyPayment).toBeCloseTo(1770, -1);
  });

  test('total payment equals monthly payment multiplied by number of months', () => {
    const result = calculateMonthlyMortgage({ ...BASE_PARAMS, principalAmount: 390_000 });
    const expected = result.monthlyPayment * 25 * 12;
    expect(result.totalPayment).toBeCloseTo(expected, 0);
  });

  test('total interest equals total payment minus principal', () => {
    const result = calculateMonthlyMortgage({ ...BASE_PARAMS, principalAmount: 390_000 });
    expect(result.totalInterest).toBeCloseTo(result.totalPayment - 390_000, 0);
  });

  test('higher principal yields higher monthly payment', () => {
    const low = calculateMonthlyMortgage({ ...BASE_PARAMS, principalAmount: 200_000 });
    const high = calculateMonthlyMortgage({ ...BASE_PARAMS, principalAmount: 500_000 });
    expect(high.monthlyPayment).toBeGreaterThan(low.monthlyPayment);
  });

  test('higher interest rate yields higher monthly payment', () => {
    const low = calculateMonthlyMortgage({ ...BASE_PARAMS, principalAmount: 390_000, annualInterestRate: 0.02 });
    const high = calculateMonthlyMortgage({ ...BASE_PARAMS, principalAmount: 390_000, annualInterestRate: 0.04 });
    expect(high.monthlyPayment).toBeGreaterThan(low.monthlyPayment);
  });

  test('throws RangeError for zero principal', () => {
    expect(() =>
      calculateMonthlyMortgage({ ...BASE_PARAMS, principalAmount: 0 })
    ).toThrow(RangeError);
  });

  test('throws RangeError for negative principal', () => {
    expect(() =>
      calculateMonthlyMortgage({ ...BASE_PARAMS, principalAmount: -1000 })
    ).toThrow(RangeError);
  });

  test('throws RangeError for zero interest rate', () => {
    expect(() =>
      calculateMonthlyMortgage({ ...BASE_PARAMS, principalAmount: 390_000, annualInterestRate: 0 })
    ).toThrow(RangeError);
  });

  test('throws RangeError for zero loan term', () => {
    expect(() =>
      calculateMonthlyMortgage({ ...BASE_PARAMS, principalAmount: 390_000, loanTermYears: 0 })
    ).toThrow(RangeError);
  });
});

// ─── calculateMSR ─────────────────────────────────────────────────────────────

describe('calculateMSR', () => {
  test('calculates correct MSR', () => {
    // mortgage 1770, income 8000 => 0.22125
    expect(calculateMSR(1770, 8000)).toBeCloseTo(0.22125, 4);
  });

  test('MSR of 1 when mortgage equals income', () => {
    expect(calculateMSR(5000, 5000)).toBe(1);
  });

  test('MSR below 0.30 for affordable scenario', () => {
    expect(calculateMSR(1770, 8000)).toBeLessThan(0.30);
  });

  test('MSR above 0.30 for unaffordable scenario', () => {
    expect(calculateMSR(3000, 8000)).toBeGreaterThan(0.30);
  });

  test('throws RangeError for zero income', () => {
    expect(() => calculateMSR(1770, 0)).toThrow(RangeError);
  });

  test('throws RangeError for negative income', () => {
    expect(() => calculateMSR(1770, -1)).toThrow(RangeError);
  });
});

// ─── calculateMedian ──────────────────────────────────────────────────────────

describe('calculateMedian', () => {
  test('returns null for empty array', () => {
    expect(calculateMedian([])).toBeNull();
  });

  test('returns the single value for a one-element array', () => {
    expect(calculateMedian([500_000])).toBe(500_000);
  });

  test('returns the middle value for odd-length array', () => {
    expect(calculateMedian([300_000, 500_000, 700_000])).toBe(500_000);
  });

  test('returns the average of two middle values for even-length array', () => {
    expect(calculateMedian([300_000, 400_000, 600_000, 700_000])).toBe(500_000);
  });

  test('correctly sorts before computing median', () => {
    expect(calculateMedian([700_000, 300_000, 500_000])).toBe(500_000);
  });

  test('does not mutate the input array', () => {
    const input = [700_000, 300_000, 500_000];
    calculateMedian(input);
    expect(input).toEqual([700_000, 300_000, 500_000]);
  });
});

// ─── deriveAffordability ──────────────────────────────────────────────────────

const makeTransaction = (price: number, id = 1): ResaleTransaction => ({
  id,
  month: '2024-01',
  town: 'TAMPINES',
  flatType: '4 ROOM',
  block: '123',
  streetName: 'TAMPINES ST 11',
  storeyRange: '07 TO 09',
  floorAreaSqm: 92,
  flatModel: 'New Generation',
  leaseCommenceDate: 1985,
  remainingLease: '58 years 06 months',
  resalePrice: price,
});

describe('deriveAffordability', () => {
  const transactions = [
    makeTransaction(480_000, 1),
    makeTransaction(520_000, 2),
    makeTransaction(500_000, 3),
  ];

  test('returns a PASS verdict when MSR is below 30%', () => {
    const result = deriveAffordability(transactions, 15_000);
    expect(result.verdict).toBe('PASS');
    expect(result.msrExceeded).toBe(false);
  });

  test('returns a FAIL verdict when MSR exceeds 30%', () => {
    const result = deriveAffordability(transactions, 3_000);
    expect(result.verdict).toBe('FAIL');
    expect(result.msrExceeded).toBe(true);
  });

  test('uses 75% LTV to compute loan amount', () => {
    const result = deriveAffordability(transactions, 10_000);
    expect(result.loanAmount).toBeCloseTo(result.medianResalePrice * 0.75, 0);
  });

  test('median resale price is derived from transactions', () => {
    const result = deriveAffordability(transactions, 10_000);
    expect(result.medianResalePrice).toBe(500_000);
  });

  test('transaction count is reflected in result', () => {
    const result = deriveAffordability(transactions, 10_000);
    expect(result.transactionCount).toBe(3);
  });

  test('explanation references the MSR percent', () => {
    const result = deriveAffordability(transactions, 10_000);
    expect(result.explanation).toContain(result.msrPercent.toString());
  });

  test('throws when transactions list is empty', () => {
    expect(() => deriveAffordability([], 10_000)).toThrow();
  });

  test('MSR of exactly 30% is treated as PASS (boundary)', () => {
    // Reverse-engineer income to achieve exactly 30% MSR
    const base = deriveAffordability(transactions, 10_000);
    const exactIncome = base.monthlyMortgage / 0.30;
    const result = deriveAffordability(transactions, exactIncome);
    expect(result.msrExceeded).toBe(false);
    expect(result.verdict).toBe('PASS');
  });
});
