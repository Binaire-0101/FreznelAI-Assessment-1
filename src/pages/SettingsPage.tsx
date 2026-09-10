/**
 * SettingsPage Component for configuration, cache management, and offline simulation.
 * Binaire Freznel AI Assessment
 */

import React, { useState } from 'react';
import { useModels } from '../context/ModelContext';
import { useNetwork } from '../context/NetworkContext';

export const SettingsPage: React.FC = () => {
  const { apiUrl, updateApiUrl, refreshModels, cacheMeta } = useModels();
  const { isOnline, isSimulatedOffline, toggleSimulatedOffline, triggerRandomToggle } = useNetwork();
  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateApiUrl(inputUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700 }}>Settings & Configuration</h1>
      <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
        Configure model repository API endpoint, monitor offline cache, and simulate network conditions.
      </p>

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Remote Model Registry API URL
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            style={{
              flex: 1,
              minWidth: '280px',
              padding: '8px 12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '3px',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 18px',
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              border: 'none',
              borderRadius: '3px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Save URL
          </button>
        </form>
        {saved && (
          <span style={{ fontSize: '12px', color: 'var(--status-online)', marginTop: '6px', display: 'block' }}>
            ✓ Endpoint saved. Refreshing models...
          </span>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Network & Offline Simulation (Requirement #8)
        </h3>
        <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Current status: <strong>{isOnline ? 'Online' : 'Offline'}</strong> {isSimulatedOffline && '(Simulated)'}
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={toggleSimulatedOffline}
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              borderRadius: '3px',
              backgroundColor: isSimulatedOffline ? '#451a1a' : 'var(--bg-secondary)',
              color: isSimulatedOffline ? '#fca5a5' : 'var(--text-primary)',
              border: isSimulatedOffline ? '1px solid #7f1d1d' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            {isSimulatedOffline ? 'Disable Offline Simulation' : 'Simulate Offline Mode'}
          </button>

          <button
            type="button"
            onClick={triggerRandomToggle}
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              borderRadius: '3px',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            Trigger Random Reconnection Flap
          </button>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Cache Metadata & Recovery
        </h3>
        {cacheMeta ? (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>Models cached: <strong style={{ color: 'var(--text-primary)' }}>{cacheMeta.count}</strong></div>
            <div>Cached at: {new Date(cacheMeta.cachedAt).toLocaleString()}</div>
            <div>Cache version: {cacheMeta.version}</div>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No cache stored yet.</div>
        )}
      </div>
    </div>
  );
};
