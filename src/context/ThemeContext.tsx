/**
 * ThemeContext enforcing exclusive dark mode and synchronization with Adobe Spectrum.
 * Binaire Freznel AI - Dark Mode Only
 */

import React, { createContext, useContext, useEffect } from 'react';

type ColorScheme = 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    try {
      localStorage.setItem('bf_ai_color_scheme', 'dark');
    } catch {
      // Ignore
    }
    const root = document.documentElement;
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  }, []);

  return (
    <ThemeContext.Provider value={{ colorScheme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useAppTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}
