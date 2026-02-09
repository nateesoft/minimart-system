'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useSettings, type ThemePreference } from './SettingsContext';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const [resolvedTheme, setResolvedTheme] = useState<Theme>('light');

  // Resolve theme based on preference
  const resolveTheme = useCallback((preference: ThemePreference): Theme => {
    if (preference === 'system') {
      return getSystemTheme();
    }
    return preference;
  }, []);

  // Update resolved theme when preference changes
  useEffect(() => {
    const newTheme = resolveTheme(settings.theme);
    setResolvedTheme(newTheme);
    applyTheme(newTheme);
  }, [settings.theme, resolveTheme]);

  // Listen for system theme changes when using 'system' preference
  useEffect(() => {
    if (settings.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      applyTheme(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    updateSettings({ theme: pref });
  }, [updateSettings]);

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        themePreference: settings.theme,
        setThemePreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
