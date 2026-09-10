/**
 * ModelList Component rendering the responsive grid of model cards,
 * loading states, offline banners, and empty filters state.
 *
 * Binaire Freznel AI Assessment - Requirements #14, #23, #24, #25
 */

import React from 'react';
import { Model } from '../../models/Model';
import { useModels } from '../../context/ModelContext';
import { useNetwork } from '../../context/NetworkContext';
import { ModelCard } from './ModelCard';
import { EmptyState } from '../common/EmptyState';

interface ModelListProps {
  onViewDetails: (model: Model) => void;
}

export const ModelList: React.FC<ModelListProps> = ({ onViewDetails }) => {
  const { filteredModels, loading, error, isFromCache, refreshModels, clearError } = useModels();
  const { isOnline } = useNetwork();

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', position: 'relative' }}>
      {/* Offline Notification Banner (Requirement #17 & #23) */}
      {!isOnline && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderLeft: '3px solid var(--status-offline)',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--status-offline)', fontWeight: 700 }}>●</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              Offline mode: showing cached model data.
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Full search, filtering, and comparison remain active locally.
          </span>
        </div>
      )}

      {/* Error state banner (Requirement #23) */}
      {error && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            backgroundColor: '#381212',
            border: '1px solid #7f1d1d',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#fca5a5',
          }}
        >
          <span>{error}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => refreshModels(true)}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '2px',
                backgroundColor: '#7f1d1d',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
            <button
              type="button"
              onClick={clearError}
              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '16px',
          }}
        >
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-secondary)',
                minHeight: '220px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: 0.6,
              }}
            >
              <div>
                <div style={{ height: '12px', width: '30%', backgroundColor: 'var(--border-subtle)', marginBottom: '10px' }} />
                <div style={{ height: '18px', width: '70%', backgroundColor: 'var(--border-subtle)', marginBottom: '10px' }} />
                <div style={{ height: '10px', width: '50%', backgroundColor: 'var(--border-subtle)', marginBottom: '16px' }} />
                <div style={{ height: '40px', width: '100%', backgroundColor: 'var(--border-subtle)' }} />
              </div>
              <div style={{ height: '28px', width: '100%', backgroundColor: 'var(--border-subtle)', marginTop: '16px' }} />
            </div>
          ))}
        </div>
      ) : filteredModels.length === 0 ? (
        <EmptyState />
      ) : (
        /* Results Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredModels.map((model) => (
            <ModelCard key={model.id} model={model} onViewDetails={onViewDetails} />
          ))}
        </div>
      )}
    </div>
  );
};
