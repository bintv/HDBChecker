import React from 'react';
import type { AffordabilityResult } from '@/types';
import { formatSGD } from '@/lib/calculations';
import styles from './AffordabilityPanel.module.css';

interface AffordabilityPanelProps {
  result: AffordabilityResult;
  monthlyIncome: number;
}

export const AffordabilityPanel: React.FC<AffordabilityPanelProps> = ({
  result,
  monthlyIncome,
}) => {
  const {
    medianResalePrice,
    loanAmount,
    monthlyMortgage,
    msrPercent,
    msrExceeded,
    verdict,
    explanation,
    transactionCount,
  } = result;

  const msrBarWidth = Math.min(msrPercent, 60); // cap visual bar at 60% for readability
  const thresholdPosition = (30 / 60) * 100;   // 30% threshold as % of bar width

  const metrics = [
    { label: 'Median resale price', value: formatSGD(medianResalePrice), sub: `${transactionCount} transactions` },
    { label: 'Loan amount (75% LTV)', value: formatSGD(loanAmount), sub: '25-year loan' },
    { label: 'Est. monthly mortgage', value: formatSGD(monthlyMortgage), sub: '2.6% p.a.' },
    { label: 'Household income', value: formatSGD(monthlyIncome), sub: 'gross monthly' },
  ];

  return (
    <section className={styles.card} aria-label="Affordability assessment">
      <h2 className={styles.sectionLabel}>Affordability Assessment</h2>

      {/* Metric cards */}
      <div className={styles.metricsGrid}>
        {metrics.map((m) => (
          <div key={m.label} className={styles.metric}>
            <span className={styles.metricLabel}>{m.label}</span>
            <span className={styles.metricValue}>{m.value}</span>
            <span className={styles.metricSub}>{m.sub}</span>
          </div>
        ))}
      </div>

      {/* MSR Visual Bar */}
      <div className={styles.msrSection}>
        <div className={styles.msrHeader}>
          <span className={styles.msrTitle}>Mortgage Servicing Ratio (MSR)</span>
          <span className={`${styles.msrBadge} ${msrExceeded ? styles.msrBadgeFail : styles.msrBadgePass}`}>
            {msrPercent.toFixed(1)}%
          </span>
        </div>
        <div className={styles.msrTrack} role="img" aria-label={`MSR bar: ${msrPercent.toFixed(1)}% of 30% threshold`}>
          <div
            className={`${styles.msrFill} ${msrExceeded ? styles.msrFillFail : styles.msrFillPass}`}
            style={{ width: `${(msrBarWidth / 60) * 100}%` }}
          />
          <div className={styles.msrThreshold} style={{ left: `${thresholdPosition}%` }} />
        </div>
        <div className={styles.msrLabels}>
          <span>0%</span>
          <span className={styles.thresholdLabel}>30% limit</span>
          <span>60%+</span>
        </div>
      </div>

      {/* Verdict */}
      <div className={`${styles.verdict} ${verdict === 'PASS' ? styles.verdictPass : styles.verdictFail}`}>
        <div className={`${styles.verdictIcon} ${verdict === 'PASS' ? styles.iconPass : styles.iconFail}`}>
          {verdict === 'PASS' ? '✓' : '✗'}
        </div>
        <div>
          <p className={styles.verdictTitle}>
            {verdict === 'PASS' ? 'Affordable' : 'Exceeds affordability threshold'}
          </p>
          <p className={styles.verdictBody}>{explanation}</p>
        </div>
      </div>

      <p className={styles.footnote}>
        * Mortgage assumes 25-year loan at 2.6% p.a. on 75% of median resale price for the selected flat type and town. MSR threshold: 30% (MAS guideline). CPF usage not factored in.
      </p>
    </section>
  );
};
