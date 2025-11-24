/**
 * Theme-related types
 */

/**
 * Available theme names
 */
export type ThemeName = 'lume' | 'nature' | 'stone' | 'ocean';

/**
 * Color mode
 */
export type ColorMode = 'light' | 'dark' | 'system';

/**
 * Theme configuration
 */
export interface ThemeConfig {
  name: ThemeName;
  mode: ColorMode;
}

/**
 * Theme color tokens
 */
export interface ThemeColors {
  primary: string;
  primaryButton: string;
  primaryButtonText: string;
  secondary: string;
  secondaryButton: string;
  contentBackground: string;
  contentBackgroundHover: string;
  contentPageBackground: string;
  menuBackground: string;
  menuBackgroundHover: string;
  pageBackground: string;
  text: string;
  textSecondary: string;
  borderLight: string;
  border: string;
  borderStrong: string;
  error: string;
  success: string;
  warning: string;
}

/**
 * Complete theme with light and dark variants
 */
export interface Theme {
  name: ThemeName;
  light: ThemeColors;
  dark: ThemeColors;
}

/**
 * Theme context value
 */
export interface ThemeContextValue {
  theme: ThemeName;
  mode: ColorMode;
  isDark: boolean;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
}
