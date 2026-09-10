import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'freznel.color-scheme';

/**
 * Colour scheme, persisted per device.
 *
 * Defaults to the OS preference and only pins a value once the user has
 * actually chosen one, so a machine in dark mode does not get a white flash on
 * first paint. The value is mirrored onto `<html data-color-scheme>` so the
 * plain-CSS parts of the app can theme themselves alongside Spectrum.
 */
export function useColorScheme() {
  const [scheme, setScheme] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      /* private mode */
    }
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.colorScheme = scheme;
    try {
      localStorage.setItem(STORAGE_KEY, scheme);
    } catch {
      /* ignore */
    }
  }, [scheme]);

  const toggle = useCallback(() => {
    setScheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return [scheme, toggle];
}
