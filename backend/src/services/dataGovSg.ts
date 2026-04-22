import axios, { AxiosError } from 'axios';
import NodeCache from 'node-cache';
import type {
  DataGovApiResponse,
  DataGovRecord,
  ResaleTransaction,
  TransactionsQuery,
  TransactionsResponse,
} from '../types';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DATA_GOV_BASE_URL = 'https://data.gov.sg/api/action/datastore_search';
// HDB Resale Flat Prices (from Jan 2017 onwards)
const RESOURCE_ID = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour — resale data is not real-time

// ─── Cache ────────────────────────────────────────────────────────────────────

const cache = new NodeCache({ stdTTL: CACHE_TTL_SECONDS, checkperiod: 120 });

function buildCacheKey(query: TransactionsQuery): string {
  return `txn:${query.town}:${query.flatType}:${query.limit ?? 50}`;
}

// ─── Data Normalisation ───────────────────────────────────────────────────────

/**
 * Transforms a raw API record into a clean, typed domain object.
 * Handles numeric string coercion and filters out malformed records.
 */
function normaliseRecord(record: DataGovRecord): ResaleTransaction | null {
  const resalePrice = parseFloat(record.resale_price);
  const floorArea = parseFloat(record.floor_area_sqm);
  const leaseYear = parseInt(record.lease_commence_date, 10);

  // Skip records with invalid core numeric fields
  if (isNaN(resalePrice) || isNaN(floorArea) || isNaN(leaseYear)) return null;

  return {
    id: record._id,
    month: record.month,
    town: record.town,
    flatType: record.flat_type,
    block: record.block,
    streetName: record.street_name,
    storeyRange: record.storey_range,
    floorAreaSqm: floorArea,
    flatModel: record.flat_model,
    leaseCommenceDate: leaseYear,
    remainingLease: record.remaining_lease,
    resalePrice,
  };
}

// ─── API Client ───────────────────────────────────────────────────────────────

/**
 * Fetches recent resale transactions matching the given flat type and town.
 * Results are cached for 1 hour to reduce upstream API load.
 */
export async function fetchResaleTransactions(
  query: TransactionsQuery
): Promise<TransactionsResponse> {
  const cacheKey = buildCacheKey(query);
  const cached = cache.get<TransactionsResponse>(cacheKey);

  if (cached) {
    return { ...cached, cached: true };
  }

  const filters = JSON.stringify({
    flat_type: query.flatType,
    town: query.town,
  });

  try {
    const response = await axios.get<DataGovApiResponse>(DATA_GOV_BASE_URL, {
      params: {
        resource_id: RESOURCE_ID,
        filters,
        limit: query.limit ?? 50,
        sort: 'month desc',
      },
      timeout: 10_000,
    });

    if (!response.data.success) {
      throw new Error('Data.gov.sg API returned a non-success response');
    }

    const transactions = response.data.result.records
      .map(normaliseRecord)
      .filter((t): t is ResaleTransaction => t !== null);

    const result: TransactionsResponse = {
      transactions,
      total: response.data.result.total,
      cached: false,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    const axiosError = err as AxiosError;

    if (axiosError.code === 'ECONNABORTED') {
      throw new Error('Request to Data.gov.sg timed out. Please try again.');
    }
    if (axiosError.response) {
      throw new Error(
        `Data.gov.sg API error: HTTP ${axiosError.response.status}`
      );
    }
    throw err;
  }
}
