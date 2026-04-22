import axios from 'axios';
import type { FlatType, Town, TransactionsApiResponse } from '@/types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Response interceptor — normalise errors ──────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

// ─── Endpoint functions ───────────────────────────────────────────────────────

export interface FetchTransactionsParams {
  flatType: FlatType;
  town: Town;
  income?: number;
  limit?: number;
}

export async function fetchTransactions(
  params: FetchTransactionsParams
): Promise<TransactionsApiResponse> {
  const { data } = await apiClient.get<TransactionsApiResponse>('/transactions', {
    params: {
      flatType: params.flatType,
      town: params.town,
      ...(params.income !== undefined && { income: params.income }),
      limit: params.limit ?? 50,
    },
  });
  return data;
}
