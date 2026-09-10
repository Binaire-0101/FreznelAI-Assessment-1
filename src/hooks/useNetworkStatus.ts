/**
 * Custom hook for actual browser network status detection and simulation.
 * Uses navigator.onLine and window online/offline events.
 *
 * Binaire Freznel AI Assessment - Requirement #8, #17
 */

import { useEffect, useState, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  effectiveOnline: boolean;
  toggleSimulatedOffline: () => void;
  triggerRandomToggle: () => void;
}

export function useNetworkStatus(): NetworkStatus {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  });

  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
    };

    const handleOffline = () => {
      setIsBrowserOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSimulatedOffline = useCallback(() => {
    setIsSimulatedOffline(prev => !prev);
  }, []);

  const triggerRandomToggle = useCallback(() => {
    setIsSimulatedOffline(true);
    const restoreDelay = 2000 + Math.random() * 3000;
    setTimeout(() => {
      setIsSimulatedOffline(false);
    }, restoreDelay);
  }, []);

  const effectiveOnline = isBrowserOnline && !isSimulatedOffline;

  return {
    isOnline: effectiveOnline,
    isSimulatedOffline,
    effectiveOnline,
    toggleSimulatedOffline,
    triggerRandomToggle,
  };
}
