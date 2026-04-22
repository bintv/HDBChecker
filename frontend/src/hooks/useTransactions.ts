import { useQuery } from '@tanstack/react-query';
import { fetchTransactions, type FetchTransactionsParams } from '@/api/transactions';
import type { TransactionsApiResponse } from '@/types';

const QUERY_KEYS = {
  transactions: (params: FetchTransactionsParams) =>
    ['transactions', params.flatType, params.town, params.income, params.limit] as const,
};

/**
 * Fetches resale transactions and affordability data for the given query.
 * The query is disabled until all required params are provided.
 */
export function useTransactions(params: Partial<FetchTransactionsParams>) {
  const isReady = Boolean(params.flatType && params.town);

  return useQuery<TransactionsApiResponse, Error>({
    queryKey: QUERY_KEYS.transactions(params as FetchTransactionsParams),
    queryFn: () => fetchTransactions(params as FetchTransactionsParams),
    enabled: isReady,
    staleTime: 60 * 60 * 1000, // 1 hour — mirrors backend cache TTL
    retry: 2,
  });
}
