/**
 * Main Application Root.
 * Configures ThemeProvider, AuthProvider, NetworkProvider, ModelProvider,
 * and mounts Adobe React Spectrum Provider with dark mode support.
 *
 * Binaire Freznel AI Assessment
 */

import React from 'react';
import { Provider, defaultTheme } from '@adobe/react-spectrum';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { ModelProvider } from './context/ModelContext';
import { ThemeProvider, useAppTheme } from './context/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import './styles/custom.css';

const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const { colorScheme } = useAppTheme();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontFamily: 'monospace',
          fontSize: '13px',
          letterSpacing: '0.04em',
        }}
      >
        <span>INITIALIZING BINAIRE FREZNEL UTILITY...</span>
      </div>
    );
  }

  return (
    <Provider theme={defaultTheme} colorScheme={colorScheme}>
      {!currentUser ? <LoginPage /> : <MainLayout />}
    </Provider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NetworkProvider>
          <ModelProvider>
            <AppContent />
          </ModelProvider>
        </NetworkProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
