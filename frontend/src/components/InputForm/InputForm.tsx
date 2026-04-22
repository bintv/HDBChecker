import React from 'react';
import type { UserInputForm, FormErrors } from '@/types';
import { FLAT_TYPE_LABELS, TOWNS, type FlatType, type Town } from '@/types';
import styles from './InputForm.module.css';

interface InputFormProps {
  form: UserInputForm;
  errors: FormErrors;
  isLoading: boolean;
  onFieldChange: <K extends keyof UserInputForm>(key: K, value: UserInputForm[K]) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export const InputForm: React.FC<InputFormProps> = ({
  form,
  errors,
  isLoading,
  onFieldChange,
  onSubmit,
  onReset,
}) => {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <section className={styles.card} aria-label="User input form">
      <h2 className={styles.sectionLabel}>Your Details</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.grid}>
          {/* Monthly Income */}
          <div className={styles.formGroup}>
            <label htmlFor="income" className={styles.label}>
              Monthly household income (SGD)
            </label>
            <input
              id="income"
              type="number"
              min={0}
              placeholder="e.g. 8000"
              value={form.monthlyIncome}
              onChange={(e) => onFieldChange('monthlyIncome', e.target.value)}
              className={errors.monthlyIncome ? styles.inputError : styles.input}
              aria-describedby={errors.monthlyIncome ? 'income-error' : undefined}
            />
            {errors.monthlyIncome && (
              <span id="income-error" className={styles.errorMsg} role="alert">
                {errors.monthlyIncome}
              </span>
            )}
          </div>

          {/* Household Members */}
          <div className={styles.formGroup}>
            <label htmlFor="members" className={styles.label}>
              Number of household members
            </label>
            <input
              id="members"
              type="number"
              min={1}
              max={20}
              placeholder="e.g. 4"
              value={form.householdMembers}
              onChange={(e) => onFieldChange('householdMembers', e.target.value)}
              className={errors.householdMembers ? styles.inputError : styles.input}
              aria-describedby={errors.householdMembers ? 'members-error' : undefined}
            />
            {errors.householdMembers && (
              <span id="members-error" className={styles.errorMsg} role="alert">
                {errors.householdMembers}
              </span>
            )}
          </div>

          {/* Flat Type */}
          <div className={styles.formGroup}>
            <label htmlFor="flatType" className={styles.label}>
              Preferred flat type
            </label>
            <select
              id="flatType"
              value={form.flatType}
              onChange={(e) => onFieldChange('flatType', e.target.value as FlatType | '')}
              className={errors.flatType ? styles.inputError : styles.input}
              aria-describedby={errors.flatType ? 'flattype-error' : undefined}
            >
              <option value="">Select flat type</option>
              {Object.entries(FLAT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.flatType && (
              <span id="flattype-error" className={styles.errorMsg} role="alert">
                {errors.flatType}
              </span>
            )}
          </div>

          {/* Town */}
          <div className={styles.formGroup}>
            <label htmlFor="town" className={styles.label}>
              Preferred town / region
            </label>
            <select
              id="town"
              value={form.town}
              onChange={(e) => onFieldChange('town', e.target.value as Town | '')}
              className={errors.town ? styles.inputError : styles.input}
              aria-describedby={errors.town ? 'town-error' : undefined}
            >
              <option value="">Select town</option>
              {TOWNS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.town && (
              <span id="town-error" className={styles.errorMsg} role="alert">
                {errors.town}
              </span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.btnPrimary} disabled={isLoading}>
            {isLoading ? 'Checking…' : 'Check affordability'}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onReset}>
            Reset
          </button>
        </div>
      </form>
    </section>
  );
};
