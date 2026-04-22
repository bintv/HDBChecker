import { Router, Request, Response, NextFunction } from 'express';
import { fetchResaleTransactions } from '../services/dataGovSg';
import { deriveAffordability } from '../lib/calculations';
import type { FlatType, Town, TransactionsQuery } from '../types';

const router = Router();

// ─── Validation Helpers ───────────────────────────────────────────────────────

const VALID_FLAT_TYPES: FlatType[] = [
  '2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE', 'MULTI-GENERATION',
];

const VALID_TOWNS: Town[] = [
  'ANG MO KIO', 'BEDOK', 'BISHAN', 'BUKIT BATOK', 'BUKIT MERAH',
  'BUKIT PANJANG', 'BUKIT TIMAH', 'CENTRAL AREA', 'CHOA CHU KANG',
  'CLEMENTI', 'GEYLANG', 'HOUGANG', 'JURONG EAST', 'JURONG WEST',
  'KALLANG/WHAMPOA', 'MARINE PARADE', 'PASIR RIS', 'PUNGGOL',
  'QUEENSTOWN', 'SEMBAWANG', 'SENGKANG', 'SERANGOON', 'TAMPINES',
  'TOA PAYOH', 'WOODLANDS', 'YISHUN',
];

function isValidFlatType(value: string): value is FlatType {
  return VALID_FLAT_TYPES.includes(value as FlatType);
}

function isValidTown(value: string): value is Town {
  return VALID_TOWNS.includes(value as Town);
}

// ─── GET /api/transactions ────────────────────────────────────────────────────

/**
 * Query params:
 *   flatType  — required, e.g. "4 ROOM"
 *   town      — required, e.g. "TAMPINES"
 *   income    — optional (SGD), used to compute affordability
 *   limit     — optional, defaults to 50, max 100
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { flatType, town, income, limit } = req.query as Record<string, string>;

    // ── Input validation ────────────────────────────────────────────────────
    if (!flatType || !isValidFlatType(flatType)) {
      res.status(400).json({
        message: `Invalid or missing flatType. Must be one of: ${VALID_FLAT_TYPES.join(', ')}`,
        code: 'INVALID_FLAT_TYPE',
        status: 400,
      });
      return;
    }

    if (!town || !isValidTown(town)) {
      res.status(400).json({
        message: `Invalid or missing town.`,
        code: 'INVALID_TOWN',
        status: 400,
      });
      return;
    }

    const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 50;
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      res.status(400).json({
        message: 'Invalid limit. Must be a number between 1 and 100.',
        code: 'INVALID_LIMIT',
        status: 400,
      });
      return;
    }

    // ── Fetch transactions ──────────────────────────────────────────────────
    try {
      const query: TransactionsQuery = { flatType, town, limit: parsedLimit };
      const { transactions, total, cached } = await fetchResaleTransactions(query);

      // ── Optional affordability calculation ──────────────────────────────
      let affordability = null;
      const parsedIncome = income ? parseFloat(income) : null;

      if (parsedIncome && parsedIncome > 0 && transactions.length > 0) {
        affordability = deriveAffordability(transactions, parsedIncome);
      }

      res.json({
        transactions,
        total,
        cached,
        ...(affordability && { affordability }),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
