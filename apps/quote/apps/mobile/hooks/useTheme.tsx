/**
 * Theme Hook
 * Zentrale Hook für Zugriff auf aktuelle Theme-Farben und -Utilities
 */

import { useMemo } from 'react';
import { useIsDarkMode, useThemeType } from '~/store/settingsStore';
import { getTheme, getCategoryGradient, type ThemeColors } from '~/themes/definitions';
import type { ThemeType } from '~/store/settingsStore';

export interface UseThemeReturn {
  colors: ThemeColors;
  isDark: boolean;
  themeType: ThemeType;
  getCategoryGradient: (category?: string) => string[];
  getCardGradient: () => string[];
  getDailyCardGradient: () => string[];
  getButtonGradient: (variant?: 'primary' | 'secondary') => string[];
}

/**
 * Hook für Zugriff auf das aktuelle Theme
 */
export function useTheme(): UseThemeReturn {
  const isDark = useIsDarkMode();
  const themeType = useThemeType();
  
  
  const colors = useMemo(() => {
    const themeColors = getTheme(themeType, isDark);
    return themeColors;
  }, [themeType, isDark]);
  
  const getCategoryGradientForTheme = useMemo(() => {
    return (category?: string) => {
      const gradient = getCategoryGradient(themeType, isDark, category);
      return gradient;
    };
  }, [themeType, isDark]);
  
  const getCardGradient = useMemo(() => {
    return () => colors.cardGradient;
  }, [colors.cardGradient]);
  
  const getDailyCardGradient = useMemo(() => {
    return () => colors.dailyCardGradient;
  }, [colors.dailyCardGradient]);
  
  const getButtonGradient = useMemo(() => {
    return (variant: 'primary' | 'secondary' = 'primary') => {
      return variant === 'primary' ? colors.buttonPrimary : colors.buttonSecondary;
    };
  }, [colors.buttonPrimary, colors.buttonSecondary]);
  
  return {
    colors,
    isDark,
    themeType,
    getCategoryGradient: getCategoryGradientForTheme,
    getCardGradient,
    getDailyCardGradient,
    getButtonGradient,
  };
}

/**
 * Hook für Text-Farben basierend auf Variante
 */
export function useTextColor(variant: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'danger' | 'success' | 'warning' = 'primary'): string {
  const { colors } = useTheme();
  return colors[variant];
}

/**
 * Hook für Hintergrund-Farben
 */
export function useBackgroundColor(variant: 'background' | 'surface' = 'background'): string {
  const { colors } = useTheme();
  return variant === 'background' ? colors.background : colors.surface;
}

/**
 * Hook für Border-Farben
 */
export function useBorderColor(): string {
  const { colors } = useTheme();
  return colors.border;
}

/**
 * Utility-Funktion für Gradient-Strings in Tailwind-Format
 */
export function gradientToTailwind(gradient: string[]): string {
  if (gradient.length === 2) {
    return `from-[${gradient[0]}] to-[${gradient[1]}]`;
  }
  if (gradient.length === 3) {
    return `from-[${gradient[0]}] via-[${gradient[1]}] to-[${gradient[2]}]`;
  }
  return `from-[${gradient[0]}] to-[${gradient[0]}]`;
}

/**
 * Utility-Funktion für CSS Gradient-Strings
 */
export function gradientToCSS(gradient: string[], direction: string = 'to bottom right'): string {
  return `linear-gradient(${direction}, ${gradient.join(', ')})`;
}

export default useTheme;