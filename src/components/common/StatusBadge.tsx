/**
 * StatusBadge Component displaying real-time connection status
 * (Online / Offline / Background Sync) with cache indication.
 * Binaire Freznel AI Assessment - Requirement #8, #17
 */

import React from 'react';
import { useModels } from '../../context/ModelContext';
import { useNetwork } from '../../context/NetworkContext';

interface StatusBadgeProps {
  showToggle?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ showToggle = true }) => {
  const { isOnline, isSimulatedOffline, toggleSimulatedOffline, triggerRandomToggle } = useNetwork();
  const { isBackgroundSyncing, isFromCache, cacheMeta } = useModels();

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-secondary)',
          fontSize: '12px',
          fontWeight: 500,
        }}
        title={
          isBackgroundSyncing
            ? 'Background synchronization in progress'
            : isOnline
            ? 'Connected to live model registry'
            : 'Working offline using validated local cache'
        }
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isBackgroundSyncing
              ? 'var(--status-syncing)'
              : isOnline
              ? 'var(--status-online)'
              : 'var(--status-offline)',
            boxShadow: isOnline ? '0 0 6px rgba(16, 185, 129, 0.4)' : 'none',
            display: 'inline-block',
          }}
        />

        <span style={{ color: 'var(--text-primary)' }}>
          {isBackgroundSyncing ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
        </span>

        {(!isOnline || isFromCache) && (
          <span
            style={{
              fontSize: '10px',
              padding: '1px 5px',
              borderRadius: '2px',
              backgroundColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
              marginLeft: '2px',
            }}
          >
            Cached {cacheMeta ? `(${cacheMeta.count})` : ''}
          </span>
        )}

        {isSimulatedOffline && (
          <span
            style={{
              fontSize: '10px',
              padding: '1px 4px',
              borderRadius: '2px',
              backgroundColor: '#451a1a',
              color: '#fca5a5',
              border: '1px solid #7f1d1d',
              fontWeight: 600,
            }}
          >
            SIM
          </span>
        )}
      </div>

      {showToggle && (
        <button
          type="button"
          onClick={toggleSimulatedOffline}
          style={{
            padding: '3px 8px',
            fontSize: '11px',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)',
            backgroundColor: isSimulatedOffline ? 'var(--text-primary)' : 'transparent',
            color: isSimulatedOffline ? 'var(--bg-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          title="Toggle simulated offline mode to test offline caching & recovery"
        >
          {isSimulatedOffline ? 'Go Online' : 'Simulate Offline'}
        </button>
      )}
    </div>
  );
};
