import React from 'react';
import { ThemeStoreProvider, useThemeStore } from '~/store/themeStore';
import { ThemeContextType } from '~/types/theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

// This wrapper component provides the theme store context
export function ThemeProvider({ children }: ThemeProviderProps) {
  return <ThemeStoreProvider>{children}</ThemeStoreProvider>;
}

// Export useTheme hook that wraps useThemeStore for backward compatibility
export function useTheme(): ThemeContextType {
  const { theme, mode, isDark, currentColors: colors, setTheme, setMode, toggleMode } = useThemeStore();

  return {
    theme,
    mode,
    isDark,
    colors,
    setTheme,
    setMode,
    toggleMode,
  };
}