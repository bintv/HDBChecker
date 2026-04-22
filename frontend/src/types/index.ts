// ─── Domain Types ─────────────────────────────────────────────────────────────

export type FlatType =
  | '2 ROOM'
  | '3 ROOM'
  | '4 ROOM'
  | '5 ROOM'
  | 'EXECUTIVE'
  | 'MULTI-GENERATION';

export const FLAT_TYPE_LABELS: Record<FlatType, string> = {
  '2 ROOM': '2-Room',
  '3 ROOM': '3-Room',
  '4 ROOM': '4-Room',
  '5 ROOM': '5-Room',
  'EXECUTIVE': 'Executive',
  'MULTI-GENERATION': 'Multi-Generation',
};

export const TOWNS = [
  'ANG MO KIO', 'BEDOK', 'BISHAN', 'BUKIT BATOK', 'BUKIT MERAH',
  'BUKIT PANJANG', 'BUKIT TIMAH', 'CENTRAL AREA', 'CHOA CHU KANG',
  'CLEMENTI', 'GEYLANG', 'HOUGANG', 'JURONG EAST', 'JURONG WEST',
  'KALLANG/WHAMPOA', 'MARINE PARADE', 'PASIR RIS', 'PUNGGOL',
  'QUEENSTOWN', 'SEMBAWANG', 'SENGKANG', 'SERANGOON', 'TAMPINES',
  'TOA PAYOH', 'WOODLANDS', 'YISHUN',
] as const;

export type Town = (typeof TOWNS)[number];

// ─── Form / User Input ────────────────────────────────────────────────────────

export interface UserInputForm {
  monthlyIncome: string;       // kept as string for controlled input
  householdMembers: string;
  flatType: FlatType | '';
  town: Town | '';
}

export interface ValidatedUserInput {
  monthlyIncome: number;
  householdMembers: number;
  flatType: FlatType;
  town: Town;
}

export type FormErrors = Partial<Record<keyof UserInputForm, string>>;

// ─── API Response Types ───────────────────────────────────────────────────────

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

export interface AffordabilityResult {
  medianResalePrice: number;
  loanAmount: number;
  monthlyMortgage: number;
  msr: number;
  msrPercent: number;
  msrExceeded: boolean;
  verdict: 'PASS' | 'FAIL';
  explanation: string;
  transactionCount: number;
}

export interface TransactionsApiResponse {
  transactions: ResaleTransaction[];
  total: number;
  cached: boolean;
  affordability?: AffordabilityResult;
}

export interface ApiErrorResponse {
  message: string;
  code: string;
  status: number;
}
