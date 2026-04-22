// ─── Data Gov SG API Response Types ───────────────────────────────────────────

export interface DataGovRecord {
  _id: number;
  month: string;           // "2024-01"
  town: string;            // "ANG MO KIO"
  flat_type: string;       // "4 ROOM"
  block: string;           // "123"
  street_name: string;     // "ANG MO KIO AVE 3"
  storey_range: string;    // "07 TO 09"
  floor_area_sqm: string;  // "92"
  flat_model: string;      // "New Generation"
  lease_commence_date: string; // "1979"
  remaining_lease: string; // "54 years 06 months"
  resale_price: string;    // "450000"
}

export interface DataGovApiResponse {
  help: string;
  success: boolean;
  result: {
    resource_id: string;
    fields: Array<{ id: string; type: string }>;
    records: DataGovRecord[];
    total: number;
    limit: number;
    offset: number;
  };
}

// ─── Application Domain Types ─────────────────────────────────────────────────

export type FlatType =
  | '2 ROOM'
  | '3 ROOM'
  | '4 ROOM'
  | '5 ROOM'
  | 'EXECUTIVE'
  | 'MULTI-GENERATION';

export type Town =
  | 'ANG MO KIO' | 'BEDOK' | 'BISHAN' | 'BUKIT BATOK'
  | 'BUKIT MERAH' | 'BUKIT PANJANG' | 'BUKIT TIMAH'
  | 'CENTRAL AREA' | 'CHOA CHU KANG' | 'CLEMENTI'
  | 'GEYLANG' | 'HOUGANG' | 'JURONG EAST' | 'JURONG WEST'
  | 'KALLANG/WHAMPOA' | 'MARINE PARADE' | 'PASIR RIS'
  | 'PUNGGOL' | 'QUEENSTOWN' | 'SEMBAWANG' | 'SENGKANG'
  | 'SERANGOON' | 'TAMPINES' | 'TOA PAYOH' | 'WOODLANDS' | 'YISHUN';

export interface ResaleTransaction {
  id: number;
  month: string;
  town: string;
  flatType: string;
  block: string;
  streetName: string;
  storeyRange: string;
  floorAreaSqm: number;
  flatModel: string;
  leaseCommenceDate: number;
  remainingLease: string;
  resalePrice: number;
}

// ─── API Request / Response contracts ────────────────────────────────────────

export interface TransactionsQuery {
  flatType: FlatType;
  town: Town;
  limit?: number;
}

export interface TransactionsResponse {
  transactions: ResaleTransaction[];
  total: number;
  cached: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// ─── User Input Types ─────────────────────────────────────────────────────────

export interface UserInput {
  monthlyIncome: number;        // SGD
  householdMembers: number;
  flatType: FlatType;
  town: Town;
}

// ─── Affordability Calculation Types ─────────────────────────────────────────

export interface MortgageParams {
  principalAmount: number;     // LTV * medianPrice
  annualInterestRate: number;  // decimal, e.g. 0.026
  loanTermYears: number;       // e.g. 25
}

export interface AffordabilityResult {
  medianResalePrice: number;
  loanAmount: number;           // LTV * median
  monthlyMortgage: number;
  msr: number;                  // decimal, e.g. 0.28
  msrPercent: number;           // 28.0
  msrExceeded: boolean;         // true if msr > 0.30
  verdict: 'PASS' | 'FAIL';
  explanation: string;
  transactionCount: number;
}

export interface MortgageCalculation {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}
