import React, { useState, useMemo } from 'react';
import type { ResaleTransaction } from '@/types';
import { formatSGD } from '@/lib/calculations';
import styles from './TransactionsTable.module.css';

interface TransactionsTableProps {
  transactions: ResaleTransaction[];
  total: number;
  cached: boolean;
}

type SortKey = 'month' | 'resalePrice' | 'floorAreaSqm' | 'storeyRange';
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey | string; label: string; sortable: boolean }[] = [
  { key: 'month', label: 'Month', sortable: true },
  { key: 'streetName', label: 'Street', sortable: false },
  { key: 'storeyRange', label: 'Storey', sortable: true },
  { key: 'floorAreaSqm', label: 'Area (sqm)', sortable: true },
  { key: 'flatModel', label: 'Model', sortable: false },
  { key: 'remainingLease', label: 'Lease left', sortable: false },
  { key: 'resalePrice', label: 'Resale price', sortable: true },
];

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  total,
  cached,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('month');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [transactions, sortKey, sortDir]);

  return (
    <section className={styles.card} aria-label="Resale transactions table">
      <div className={styles.tableHeader}>
        <h2 className={styles.sectionLabel}>Recent Resale Transactions</h2>
        <div className={styles.metaRow}>
          <span className={styles.meta}>
            Showing {transactions.length} of {total.toLocaleString()} transactions
          </span>
          {cached && <span className={styles.cacheBadge}>Cached</span>}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable ? styles.thSortable : styles.th}
                  onClick={col.sortable ? () => handleSort(col.key as SortKey) : undefined}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === 'asc' ? 'ascending' : 'descending'
                      : undefined
                  }
                >
                  {col.label}
                  {col.sortable && (
                    <span className={styles.sortIcon} aria-hidden="true">
                      {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx) => (
              <tr key={tx.id} className={styles.row}>
                <td className={styles.td}>{tx.month}</td>
                <td className={styles.td}>{tx.block} {tx.streetName}</td>
                <td className={styles.td}>{tx.storeyRange}</td>
                <td className={styles.td}>{tx.floorAreaSqm}</td>
                <td className={styles.td}>{tx.flatModel}</td>
                <td className={styles.td}>{tx.remainingLease}</td>
                <td className={`${styles.td} ${styles.price}`}>{formatSGD(tx.resalePrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
