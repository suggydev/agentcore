'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ThemeMode } from '@/design/tokens';

interface ThemeContextValue {
  theme: ThemeMode;
  toggle: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'agentcore-theme';

function getSystemPreference(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return getSystemPreference();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const applyTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const toggle = useCallback(() => {
    applyTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, applyTheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    applyTheme(mode);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
