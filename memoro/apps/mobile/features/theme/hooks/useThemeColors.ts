/**
 * Hook to access theme colors with proper typing
 */

import { useTheme } from '../ThemeProvider';
import { ThemeColorSet } from '~/features/core/types';
import tailwindConfig from '~/tailwind.config.js';

interface ExtendedColors {
  theme?: {
    extend?: {
      colors?: {
        [key: string]: {
          [key: string]: string;
        };
        dark?: {
          [key: string]: {
            [key: string]: string;
          };
        };
      };
    };
  };
}

/**
 * Get theme colors with proper typing
 */
export function useThemeColors(): ThemeColorSet {
  const { isDark, themeVariant } = useTheme();
  
  const colors = tailwindConfig as ExtendedColors;
  const themeColors = colors.theme?.extend?.colors;
  
  if (!themeColors) {
    // Return default colors if theme is not properly configured
    return {
      primary: '#4ADE80',
      secondary: '#22C55E', 
      accent: '#16A34A',
      background: '#FFFFFF',
      contentBackground: '#F9FAFB',
      contentBackgroundHover: '#F3F4F6',
      text: '#111827',
      subtext: '#6B7280',
      border: '#E5E7EB',
      shadow: '#000000',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6'
    };
  }

  // Get the color set based on dark mode and variant
  const colorSet = isDark 
    ? themeColors.dark?.[themeVariant]
    : themeColors[themeVariant];

  // Return the color set with proper typing
  return {
    primary: colorSet?.primary || '#4ADE80',
    secondary: colorSet?.secondary || '#22C55E',
    accent: colorSet?.accent || '#16A34A',
    background: colorSet?.background || '#FFFFFF',
    contentBackground: colorSet?.contentBackground || '#F9FAFB',
    contentBackgroundHover: colorSet?.contentBackgroundHover || '#F3F4F6',
    text: colorSet?.text || '#111827',
    subtext: colorSet?.subtext || '#6B7280',
    border: colorSet?.border || '#E5E7EB',
    shadow: colorSet?.shadow || '#000000',
    error: colorSet?.error || '#EF4444',
    success: colorSet?.success || '#10B981',
    warning: colorSet?.warning || '#F59E0B',
    info: colorSet?.info || '#3B82F6'
  };
}

/**
 * Get a specific theme color
 */
export function useThemeColor(colorKey: keyof ThemeColorSet): string {
  const colors = useThemeColors();
  return colors[colorKey];
}