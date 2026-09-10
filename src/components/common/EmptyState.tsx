/**
 * EmptyState Component for zero search/filter results.
 * Binaire Freznel AI Assessment - Requirement #25
 */

import React from 'react';
import { useModels } from '../../context/ModelContext';

export const EmptyState: React.FC = () => {
  const { clearFilters } = useModels();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        border: '1px dashed var(--border-subtle)',
        borderRadius: '4px',
        backgroundColor: 'var(--bg-secondary)',
        margin: '24px',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          marginBottom: '16px',
          color: 'var(--text-secondary)',
        }}
      >
        ∅
      </div>

      <h3
        style={{
          margin: '0 0 8px 0',
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        No models found
      </h3>

      <p
        style={{
          margin: '0 0 20px 0',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          maxWidth: '400px',
          lineHeight: 1.5,
        }}
      >
        Try changing your search query, selecting different model tags, or clearing one or more filters.
      </p>

      <button
        type="button"
        onClick={clearFilters}
        style={{
          padding: '8px 20px',
          fontSize: '12px',
          fontWeight: 600,
          borderRadius: '3px',
          backgroundColor: 'var(--text-primary)',
          color: 'var(--bg-primary)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Clear Filters
      </button>
    </div>
  );
};
