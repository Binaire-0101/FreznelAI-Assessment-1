import React from 'react';
import { Cpu, Wifi, WifiOff, User, LogOut, Code2, ShieldAlert, Sparkles } from 'lucide-react';
import { NetworkState, UserProfile } from '../types';

interface HeaderProps {
  networkState: NetworkState;
  onToggleSimulatedOffline: () => void;
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenTechPanel: () => void;
  isLiveApi: boolean;
  onToggleLiveApi: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  networkState,
  onToggleSimulatedOffline,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onOpenTechPanel,
  isLiveApi,
  onToggleLiveApi,
  theme,
  onToggleTheme
}) => {
  return (
    <header className="spectrum-Header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 28px',
      backgroundColor: 'var(--spectrum-global-color-gray-100)',
      borderBottom: '1px solid var(--spectrum-global-color-gray-300)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #1473e6 0%, #2680eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(20, 115, 230, 0.4)'
        }}>
          <Cpu size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Spectrum Model Selector
            <span className="spectrum-Tag spectrum-Tag--blue" style={{ fontSize: '10px' }}>Adobe Spectrum</span>
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-600)', margin: 0 }}>
            Binaire Freznel AI Assessment Utility
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Live API / Mock API Toggle */}
        <button
          className={`spectrum-Button ${isLiveApi ? 'spectrum-Button--accent' : 'spectrum-Button--secondary'}`}
          onClick={onToggleLiveApi}
          title="Switch between Hugging Face Live API and Local Cache API"
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          <Sparkles size={14} />
          {isLiveApi ? 'Live API Mode' : 'Cached API Mode'}
        </button>

        {/* Network Online/Offline Status Indicator */}
        <div 
          onClick={onToggleSimulatedOffline}
          className={`spectrum-StatusLight ${networkState.isOnline ? 'spectrum-StatusLight--positive' : 'spectrum-StatusLight--negative'}`}
          style={{
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '16px',
            backgroundColor: 'var(--spectrum-global-color-gray-200)',
            border: '1px solid var(--spectrum-global-color-gray-300)',
            fontSize: '12px'
          }}
          title="Click to simulate random Online/Offline network state"
        >
          <div className="spectrum-StatusLight-dot" />
          {networkState.isOnline ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wifi size={13} color="var(--spectrum-semantic-positive)" />
              Online {networkState.isSimulatedOffline && '(Simulated)'}
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <WifiOff size={13} color="var(--spectrum-semantic-negative)" />
              Offline Mode
            </span>
          )}
        </div>

        {/* Tech QA / Background Fetch Solutions Drawer Button */}
        <button
          className="spectrum-Button spectrum-Button--secondary"
          onClick={onOpenTechPanel}
          style={{ fontSize: '12px', padding: '6px 12px' }}
          title="View Non-Async Fetch & Corruption Prevention Solutions"
        >
          <Code2 size={14} />
          Tech & Background Fetch Panel
        </button>

        {/* Auth / User Profile Button */}
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: 'var(--spectrum-global-color-gray-200)',
              fontSize: '13px',
              fontWeight: 600
            }}>
              <User size={14} />
              <span>{currentUser.displayName}</span>
              {currentUser.isAnonymous && <span style={{ fontSize: '10px', opacity: 0.7 }}>(Guest)</span>}
            </div>
            <button
              className="spectrum-Button spectrum-Button--quiet"
              onClick={onLogout}
              title="Sign Out"
              style={{ padding: '6px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            className="spectrum-Button spectrum-Button--accent"
            onClick={onOpenAuthModal}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            <User size={14} />
            Sign Up / Log In
          </button>
        )}
      </div>
    </header>
  );
};
