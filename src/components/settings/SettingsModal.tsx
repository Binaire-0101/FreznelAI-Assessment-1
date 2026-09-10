/**
 * SettingsModal Component allowing configuration of remote API URL,
 * cache inspections, online/offline testing simulations, and architecture verification.
 *
 * Binaire Freznel AI Assessment - Requirements #8, #10, #18, #19, #20
 */

import React, { useState } from 'react';
import { useModels } from '../../context/ModelContext';
import { useNetwork } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    apiUrl,
    updateApiUrl,
    cacheMeta,
    refreshInBackground,
    isBackgroundSyncing,
    models,
  } = useModels();

  const { isOnline, isSimulatedOffline, toggleSimulatedOffline, triggerRandomToggle } = useNetwork();
  const { isFirebaseLive, currentUser } = useAuth();

  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    updateApiUrl(inputUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTriggerBackgroundFetch = () => {
    refreshInBackground();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              System Settings & Architecture Diagnostics
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Binaire Freznel Model Utility Configuration
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* API URL Config */}
          <form onSubmit={handleSaveUrl}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
              Remote Models API URL (VITE_MODELS_API_URL)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://api.example.com/models (Leave blank to use authentic fallback registry)"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
            {saveSuccess && (
              <span style={{ fontSize: '11px', color: 'var(--status-online)', marginTop: '4px', display: 'block' }}>
                ✓ API endpoint updated and models refreshed.
              </span>
            )}
          </form>

          {/* Network Simulation Controls (Requirement #8) */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
              Network & Offline Testing Controls (Requirement #8)
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Test application behavior when switched between online and offline modes randomly:
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={toggleSimulatedOffline}
                style={{
                  padding: '7px 12px',
                  fontSize: '12px',
                  borderRadius: '3px',
                  backgroundColor: isSimulatedOffline ? '#451a1a' : 'var(--bg-secondary)',
                  color: isSimulatedOffline ? '#fca5a5' : 'var(--text-primary)',
                  border: isSimulatedOffline ? '1px solid #7f1d1d' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {isSimulatedOffline ? 'Disable Offline Simulation (Go Online)' : 'Simulate Going Offline'}
              </button>

              <button
                type="button"
                onClick={triggerRandomToggle}
                style={{
                  padding: '7px 12px',
                  fontSize: '12px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                🎲 Random Network Toggle
              </button>
            </div>
          </div>

          {/* Background Fetch Without Async/Await (Requirement #18) */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
              Promise-Based Background Fetch (Requirement #18)
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Executes background synchronization strictly using ES6 Promise chains (<code className="font-mono">.then/.catch/.finally</code>) without async/await:
            </p>
            <button
              type="button"
              onClick={handleTriggerBackgroundFetch}
              disabled={isBackgroundSyncing}
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                borderRadius: '3px',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                border: 'none',
                cursor: isBackgroundSyncing ? 'wait' : 'pointer',
                fontWeight: 600,
              }}
            >
              {isBackgroundSyncing ? 'Syncing via Promise Chain...' : 'Trigger Background Fetch Now'}
            </button>
          </div>

          {/* Large JSON Safety & Cache Diagnostics (Requirement #19 & #20) */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
              Cache & Large JSON Safety Diagnostics (Requirement #19 & #20)
            </div>
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '3px',
                fontSize: '12px',
                lineHeight: 1.6,
                fontFamily: 'monospace',
              }}
            >
              <div>Storage Engine: IndexedDB (with localStorage mirror)</div>
              <div>Cached Models Count: {cacheMeta ? cacheMeta.count : models.length}</div>
              <div>Cache Schema Version: {cacheMeta ? cacheMeta.version : 1}</div>
              <div>Last Verified Cache: {cacheMeta ? new Date(cacheMeta.timestamp).toLocaleString() : 'Active session'}</div>
              <div>Connection Mode: {isOnline ? 'Online (Real-time)' : 'Offline (Protected Local Cache)'}</div>
              <div>Firebase Status: {isFirebaseLive ? 'Connected Live' : 'Developer Sandbox Session'}</div>
              <div>User: {currentUser?.email || currentUser?.displayName || 'Anonymous'}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 18px',
              fontSize: '12px',
              borderRadius: '3px',
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
