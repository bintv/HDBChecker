import type { AffordabilityResult, ResaleTransaction } from '@/types';

export const MORTGAGE_CONSTANTS = {
  ANNUAL_INTEREST_RATE: 0.026,
  LOAN_TERM_YEARS: 25,
  LTV_RATIO: 0.75,
  MSR_THRESHOLD: 0.30,
} as const;

export function calculateMonthlyMortgage(principal: number): number {
  const r = MORTGAGE_CONSTANTS.ANNUAL_INTEREST_RATE / 12;
  const n = MORTGAGE_CONSTANTS.LOAN_TERM_YEARS * 12;
  const factor = Math.pow(1 + r, n);
  return principal * (r * factor) / (factor - 1);
}

export function calculateMedian(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Client-side affordability derivation — used as fallback if backend doesn't return it. */
export function deriveAffordabilityLocally(
  transactions: ResaleTransaction[],
  monthlyIncome: number
): AffordabilityResult | null {
  const prices = transactions.map((t) => t.resalePrice).filter(Boolean);
  const median = calculateMedian(prices);
  if (!median) return null;

  const loanAmount = median * MORTGAGE_CONSTANTS.LTV_RATIO;
  const monthlyMortgage = calculateMonthlyMortgage(loanAmount);
  const msr = monthlyMortgage / monthlyIncome;
  const msrPercent = Math.round(msr * 1000) / 10;
  const msrExceeded = msr > MORTGAGE_CONSTANTS.MSR_THRESHOLD;

  return {
    medianResalePrice: median,
    loanAmount,
    monthlyMortgage,
    msr,
    msrPercent,
    msrExceeded,
    verdict: msrExceeded ? 'FAIL' : 'PASS',
    explanation: msrExceeded
      ? `MSR of ${msrPercent}% exceeds the 30% guideline.`
      : `MSR of ${msrPercent}% is within the 30% guideline.`,
    transactionCount: transactions.length,
  };
}

export function formatSGD(value: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 0,
  }).format(value);
}
