/**
 * NetworkContext providing network connectivity state and offline simulation controls.
 * Binaire Freznel AI Assessment - Requirements #8, #17
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { NetworkService } from '../services/NetworkService';

interface NetworkContextType {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  triggerRandomToggle: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const service = NetworkService.getInstance();
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  });
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSimulatedOffline = useCallback(() => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      service.setSimulatedOffline(next);
      return next;
    });
  }, [service]);

  const triggerRandomToggle = useCallback(() => {
    setIsSimulatedOffline(true);
    service.setSimulatedOffline(true);
    const restoreDelay = 2000 + Math.random() * 3000;
    setTimeout(() => {
      setIsSimulatedOffline(false);
      service.setSimulatedOffline(false);
    }, restoreDelay);
  }, [service]);

  const isOnline = isBrowserOnline && !isSimulatedOffline;

  const value = useMemo(
    () => ({
      isOnline,
      isSimulatedOffline,
      toggleSimulatedOffline,
      triggerRandomToggle,
    }),
    [isOnline, isSimulatedOffline, toggleSimulatedOffline, triggerRandomToggle]
  );

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
