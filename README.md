# HDB Resale Flat Affordability Checker

A full-stack web application that helps Singapore residents assess whether a resale HDB flat is affordable based on their household income and preferences.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Key Design Decisions](#key-design-decisions)
- [Assumptions](#assumptions)
- [Suggested GitLab Commit History](#suggested-gitlab-commit-history)

---

## Features

- **Step 1 — User input**: Monthly income, household members, flat type, and preferred town
- **Step 2 — Live data**: Fetches the 50 most recent resale transactions from the official data.gov.sg API, with sortable columns
- **Step 3 — Affordability**: Computes monthly mortgage, MSR, and a clear pass/fail verdict with explanation
- Responsive layout for mobile, iPad portrait, and desktop
- Dark mode support out of the box
- Backend caching (1 hour TTL) to avoid hammering the upstream API
- Rate limiting on the backend (100 req / 15 min per IP)

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|--------------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, React Query (TanStack) |
| Backend   | Node.js, Express, TypeScript                    |
| Testing   | Vitest + Testing Library (frontend), Jest (backend) |
| Styling   | CSS Modules with design tokens (light + dark mode) |
| Data      | [data.gov.sg HDB Resale Prices API](https://data.gov.sg) |

---

## Project Structure

```
hdb-checker/
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Express app entry, middleware
│   │   ├── routes/
│   │   │   └── transactions.ts       # GET /api/transactions
│   │   ├── services/
│   │   │   └── dataGovSg.ts          # API client + in-memory cache
│   │   ├── lib/
│   │   │   ├── calculations.ts       # Pure mortgage/MSR functions
│   │   │   └── calculations.test.ts  # Jest unit tests
│   │   └── types/
│   │       └── index.ts              # Shared TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── main.tsx                  # React entry point
    │   ├── App.tsx                   # Root component + QueryClientProvider
    │   ├── api/
    │   │   └── transactions.ts       # Axios client + endpoint functions
    │   ├── hooks/
    │   │   ├── useTransactions.ts    # React Query data fetching hook
    │   │   └── useForm.ts            # Form state + validation
    │   ├── lib/
    │   │   ├── calculations.ts       # Client-side calculation helpers
    │   │   └── calculations.test.ts  # Vitest unit tests
    │   ├── components/
    │   │   ├── InputForm/            # Step 1: user input form
    │   │   ├── AffordabilityPanel/   # Step 3: metrics + MSR bar + verdict
    │   │   ├── TransactionsTable/    # Step 2: sortable data table
    │   │   └── UI/                   # Shared: ErrorBanner, LoadingSpinner, EmptyState
    │   ├── types/
    │   │   └── index.ts              # Typed domain models + API contracts
    │   └── index.css                 # Global reset + CSS design tokens
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+

### 1. Clone the repository

```bash
git clone https://github.com/bintv/HDBChecker.git
cd HDBChecker
```

### 2. Start the backend

```bash
cd backend
cp .env.example .env       # uses PORT=4000 by default
npm install
npm run dev                # starts on http://localhost:4000
```

**Verify:** `curl http://localhost:4000/health` should return `{"status":"ok"}`.

### 3. Start the frontend

```bash
cd ../frontend
cp .env.example .env.local  # sets VITE_API_BASE_URL=http://localhost:4000/api
npm install
npm run dev                 # starts on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** The Vite dev server proxies `/api` requests to `http://localhost:4000`, so both `VITE_API_BASE_URL` and the Vite proxy config work correctly in development. In production, set `VITE_API_BASE_URL` to your deployed backend URL.

---

## Running Tests

### Backend unit tests (Jest)

```bash
cd backend
npm test
```

Tests cover:
- `calculateMonthlyMortgage` — amortisation formula correctness, edge cases, invalid inputs
- `calculateMSR` — ratio computation, boundary at 30%, error on zero income
- `calculateMedian` — odd/even arrays, single element, empty array, mutation safety
- `deriveAffordability` — PASS/FAIL verdicts, LTV application, empty data error

### Frontend unit tests (Vitest)

```bash
cd frontend
npm test
```

Tests mirror the backend suite for client-side calculation helpers.

---

## Key Design Decisions

### Separate backend (API proxy pattern)

The frontend never calls data.gov.sg directly. All external API calls are routed through the Express backend, which provides:

1. **CORS isolation** — the upstream API does not set permissive CORS headers for all origins
2. **In-memory caching** (`node-cache`, 1-hour TTL) — resale transaction data is not real-time, so repeated queries for the same flat type + town are served instantly without hammering the government API
3. **Input validation** — flat type and town enums are validated server-side before the upstream call
4. **Rate limiting** — prevents abuse without needing authentication
5. **Centralised error normalisation** — one error shape for all failure modes

### Pure, testable calculation functions

All mortgage and affordability logic lives in `lib/calculations.ts` (both backend and frontend) as pure functions with no side effects. This makes them trivially unit-testable and reusable regardless of UI framework.

### React Query for server state

`@tanstack/react-query` manages all data-fetching lifecycle (loading, error, stale, refetch). This avoids hand-rolled `useEffect`/`useState` patterns and gives automatic deduplication and background refresh.

### TypeScript strict mode throughout

Both `tsconfig.json` files enable `"strict": true`. All domain objects have explicit interfaces in `types/index.ts`. String-to-number coercion (from raw API strings) is isolated in the normalisation layer (`dataGovSg.ts`) so the rest of the codebase only sees typed numbers.

### CSS Modules + design tokens

Component styles are scoped via CSS Modules. Colours and spacing are defined as CSS custom properties in `index.css`, enabling a clean dark mode via `@media (prefers-color-scheme: dark)` without any JavaScript theme toggle logic.

---

## Assumptions

| Area | Assumption |
|------|-----------|
| Loan parameters | 25-year tenure, 2.6% p.a. (reference to HDB concessionary rate as of 2024), 75% LTV |
| MSR threshold | 30% of gross monthly household income (MAS guideline for HDB flats) |
| CPF | Not factored in; the checker uses gross income and cash mortgage only |
| Transactions | Most recent 50 records for the selected flat type + town from data.gov.sg |
| Median price | Calculated from the 50 fetched records, not the entire historical dataset |
| Cache TTL | 1 hour — resale data is updated monthly by HDB, so hourly caching is safe |
| Household income | Gross (before CPF contributions), entered by user |

---

## Suggested GitLab Commit History

Below is a meaningful commit sequence to use when building this project incrementally:

```
feat: initialise monorepo with backend and frontend scaffolding
feat(backend): add TypeScript types for HDB domain and API contracts
feat(backend): implement mortgage and MSR calculation functions
test(backend): add Jest unit tests for all calculation functions
feat(backend): add data.gov.sg API service with normalisation and caching
feat(backend): add transactions route with input validation and rate limiting
feat(frontend): scaffold Vite + React + TypeScript project with design tokens
feat(frontend): add shared types mirroring backend domain models
feat(frontend): implement calculation helpers with Vitest unit tests
feat(frontend): add axios API client and useTransactions React Query hook
feat(frontend): build InputForm component with validation
feat(frontend): build AffordabilityPanel with MSR bar and verdict
feat(frontend): build sortable TransactionsTable component
feat(frontend): wire up App component with full data and affordability flow
feat(frontend): add responsive CSS and dark mode support
docs: add README with setup instructions, design decisions, and assumptions
```

---

## API Reference

### `GET /api/transactions`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `flatType` | string | ✓ | e.g. `4 ROOM` |
| `town` | string | ✓ | e.g. `TAMPINES` |
| `income` | number | — | Monthly income in SGD; triggers affordability calc |
| `limit` | number | — | Max records to return (default: 50, max: 100) |

**Response:**

```json
{
  "transactions": [...],
  "total": 1234,
  "cached": false,
  "affordability": {
    "medianResalePrice": 500000,
    "loanAmount": 375000,
    "monthlyMortgage": 1704.32,
    "msr": 0.2130,
    "msrPercent": 21.3,
    "msrExceeded": false,
    "verdict": "PASS",
    "explanation": "Your MSR of 21.3% is within the 30% MAS guideline...",
    "transactionCount": 50
  }
}
```

---

## License

MIT
