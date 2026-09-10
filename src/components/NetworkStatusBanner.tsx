import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { NetworkState } from '../types';

interface NetworkStatusBannerProps {
  networkState: NetworkState;
  onToggleSimulatedOffline: () => void;
  isOfflineData: boolean;
}

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
  networkState,
  onToggleSimulatedOffline,
  isOfflineData
}) => {
  if (networkState.isOnline && !isOfflineData) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: networkState.isOnline ? 'rgba(230, 134, 25, 0.18)' : 'rgba(227, 72, 80, 0.18)',
      borderBottom: `1px solid ${networkState.isOnline ? 'var(--spectrum-semantic-notice)' : 'var(--spectrum-semantic-negative)'}`,
      padding: '10px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '13px',
      fontWeight: 600,
      color: 'var(--spectrum-global-color-gray-900)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {networkState.isOnline ? (
          <Wifi size={16} color="var(--spectrum-semantic-notice)" />
        ) : (
          <WifiOff size={16} color="var(--spectrum-semantic-negative)" />
        )}
        <span>
          {!networkState.isOnline
            ? `Offline Connection Status: Device is currently disconnected from internet or network has been simulated as offline. Full API model search is running smoothly using IndexedDB Offline Cache.`
            : `Network Connection Reconnected. Model selection utility operating with live data.`}
        </span>
      </div>

      <button
        className="spectrum-Button spectrum-Button--quiet"
        onClick={onToggleSimulatedOffline}
        style={{ fontSize: '12px', padding: '4px 10px' }}
      >
        <RefreshCw size={13} />
        {networkState.isSimulatedOffline ? 'Switch to Online Mode' : 'Simulate Offline Mode'}
      </button>
    </div>
  );
};
