import React from 'react';

// ─── ErrorBanner ──────────────────────────────────────────────────────────────

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => (
  <div
    role="alert"
    style={{
      background: 'var(--color-danger-bg)',
      border: '1px solid var(--color-danger-border)',
      borderRadius: '8px',
      padding: '0.875rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      marginBottom: '1rem',
    }}
  >
    <span style={{ fontSize: '13px', color: 'var(--color-danger)' }}>{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--color-danger)',
          background: 'transparent',
          border: '1px solid var(--color-danger-border)',
          borderRadius: '6px',
          padding: '4px 10px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Retry
      </button>
    )}
  </div>
);

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

interface LoadingSpinnerProps {
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading…',
}) => (
  <div
    role="status"
    aria-label={label}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      padding: '2.5rem 1rem',
      color: 'var(--color-text-muted)',
      fontSize: '14px',
    }}
  >
    <div
      style={{
        width: '20px',
        height: '20px',
        border: '2px solid var(--color-border)',
        borderTopColor: 'var(--color-accent)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
    {label}
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message }) => (
  <div
    style={{
      textAlign: 'center',
      padding: '3rem 1rem',
      color: 'var(--color-text-muted)',
      fontSize: '14px',
    }}
  >
    {message}
  </div>
);
