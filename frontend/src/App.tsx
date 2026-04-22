import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InputForm } from '@/components/InputForm';
import { AffordabilityPanel } from '@/components/AffordabilityPanel';
import { TransactionsTable } from '@/components/TransactionsTable';
import { ErrorBanner, LoadingSpinner, EmptyState } from '@/components/UI';
import { useForm } from '@/hooks/useForm';
import { useTransactions } from '@/hooks/useTransactions';
import { deriveAffordabilityLocally } from '@/lib/calculations';
import type { ValidatedUserInput } from '@/types';
import styles from './App.module.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

// ─── Inner app (needs QueryClientProvider above) ──────────────────────────────

const AppInner: React.FC = () => {
  const { form, errors, setField, validate, reset } = useForm();
  const [submitted, setSubmitted] = useState<ValidatedUserInput | null>(null);

  const { data, isLoading, isError, error, refetch } = useTransactions(
    submitted
      ? {
          flatType: submitted.flatType,
          town: submitted.town,
          income: submitted.monthlyIncome,
          limit: 50,
        }
      : {}
  );

  function handleSubmit() {
    const validated = validate();
    if (!validated) return;
    setSubmitted(validated);
  }

  function handleReset() {
    reset();
    setSubmitted(null);
  }

  // Derive affordability locally if backend didn't return it
  const affordability =
    data?.affordability ??
    (data && submitted
      ? deriveAffordabilityLocally(data.transactions, submitted.monthlyIncome)
      : null);

  return (
    <div className={styles.layout}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoMark} aria-hidden="true">HDB</div>
          <div>
            <h1 className={styles.title}>Resale Flat Affordability Checker</h1>
            <p className={styles.subtitle}>
              Find recent resale transactions and check affordability based on your household income.
            </p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Input Form */}
        <InputForm
          form={form}
          errors={errors}
          isLoading={isLoading}
          onFieldChange={setField}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />

        {/* Results area */}
        {submitted && (
          <>
            {isLoading && (
              <LoadingSpinner label="Fetching transactions from data.gov.sg…" />
            )}

            {isError && (
              <ErrorBanner
                message={error?.message ?? 'Failed to fetch data. Please try again.'}
                onRetry={() => refetch()}
              />
            )}

            {data && !isLoading && (
              <>
                {affordability ? (
                  <AffordabilityPanel
                    result={affordability}
                    monthlyIncome={submitted.monthlyIncome}
                  />
                ) : (
                  <EmptyState message="No transactions found for this flat type and town combination. Try a different selection." />
                )}

                {data.transactions.length > 0 ? (
                  <TransactionsTable
                    transactions={data.transactions}
                    total={data.total}
                    cached={data.cached}
                  />
                ) : null}
              </>
            )}
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Data sourced from <a href="https://data.gov.sg" target="_blank" rel="noopener noreferrer">data.gov.sg</a>. For reference only — not financial advice.</p>
      </footer>
    </div>
  );
};

// ─── Root export with QueryClientProvider ─────────────────────────────────────

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AppInner />
  </QueryClientProvider>
);

export default App;
