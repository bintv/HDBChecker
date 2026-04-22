import type {
  AffordabilityResult,
  MortgageCalculation,
  MortgageParams,
  ResaleTransaction,
} from '../types';

// ─── Constants ─────────────────────────────────────────────────────────────────

export const MORTGAGE_CONSTANTS = {
  ANNUAL_INTEREST_RATE: 0.026,   // 2.6% p.a. (HDB concessionary rate reference)
  LOAN_TERM_YEARS: 25,
  LTV_RATIO: 0.75,               // Loan-to-Value: 75% of purchase price
  MSR_THRESHOLD: 0.30,           // Mortgage Servicing Ratio cap: 30%
} as const;

// ─── Core Calculation Functions ───────────────────────────────────────────────

/**
 * Computes the fixed monthly mortgage payment using the standard amortisation formula.
 *   M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * where P = principal, r = monthly rate, n = total months
 */
export function calculateMonthlyMortgage(params: MortgageParams): MortgageCalculation {
  const { principalAmount, annualInterestRate, loanTermYears } = params;

  if (principalAmount <= 0) throw new RangeError('Principal must be positive');
  if (annualInterestRate <= 0) throw new RangeError('Interest rate must be positive');
  if (loanTermYears <= 0) throw new RangeError('Loan term must be positive');

  const monthlyRate = annualInterestRate / 12;
  const totalMonths = loanTermYears * 12;
  const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
  const monthlyPayment = principalAmount * (monthlyRate * compoundFactor) / (compoundFactor - 1);
  const totalPayment = monthlyPayment * totalMonths;
  const totalInterest = totalPayment - principalAmount;

  return {
    monthlyPayment: roundToTwoDecimals(monthlyPayment),
    totalPayment: roundToTwoDecimals(totalPayment),
    totalInterest: roundToTwoDecimals(totalInterest),
  };
}

/**
 * Computes the Mortgage Servicing Ratio (MSR).
 * MSR = monthly mortgage payment / gross monthly household income
 */
export function calculateMSR(monthlyMortgage: number, grossMonthlyIncome: number): number {
  if (grossMonthlyIncome <= 0) throw new RangeError('Income must be positive');
  return monthlyMortgage / grossMonthlyIncome;
}

/**
 * Extracts the median value from an array of numbers.
 * Returns null if the array is empty.
 */
export function calculateMedian(values: number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Derives the full affordability report from transactions and user income.
 * This is the main composition function called by the API handler.
 */
export function deriveAffordability(
  transactions: ResaleTransaction[],
  monthlyIncome: number
): AffordabilityResult {
  const prices = transactions.map((t) => t.resalePrice).filter((p) => p > 0);
  const medianResalePrice = calculateMedian(prices);

  if (medianResalePrice === null) {
    throw new Error('No valid resale prices found in transaction data');
  }

  const loanAmount = medianResalePrice * MORTGAGE_CONSTANTS.LTV_RATIO;
  const { monthlyPayment } = calculateMonthlyMortgage({
    principalAmount: loanAmount,
    annualInterestRate: MORTGAGE_CONSTANTS.ANNUAL_INTEREST_RATE,
    loanTermYears: MORTGAGE_CONSTANTS.LOAN_TERM_YEARS,
  });

  const msr = calculateMSR(monthlyPayment, monthlyIncome);
  const msrPercent = roundToTwoDecimals(msr * 100);
  const msrExceeded = msr > MORTGAGE_CONSTANTS.MSR_THRESHOLD;
  const verdict = msrExceeded ? 'FAIL' : 'PASS';

  const explanation = msrExceeded
    ? `Your MSR of ${msrPercent}% exceeds the 30% guideline. The estimated monthly mortgage of S$${formatCurrency(monthlyPayment)} is too high relative to your gross income of S$${formatCurrency(monthlyIncome)}/month. Consider a smaller flat type, a different town, or increasing household income.`
    : `Your MSR of ${msrPercent}% is within the 30% MAS guideline. The estimated monthly mortgage of S$${formatCurrency(monthlyPayment)} is manageable on a gross income of S$${formatCurrency(monthlyIncome)}/month.`;

  return {
    medianResalePrice,
    loanAmount: roundToTwoDecimals(loanAmount),
    monthlyMortgage: monthlyPayment,
    msr: roundToTwoDecimals(msr),
    msrPercent,
    msrExceeded,
    verdict,
    explanation,
    transactionCount: transactions.length,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatCurrency(value: number): string {
  return Math.round(value).toLocaleString('en-SG');
}
