/**
 * @memoro/design-tokens - Colors
 *
 * Central color definitions for all memoro apps.
 * Extracted from mobile app theme system.
 */

/**
 * Base color palette
 * These are the raw colors that semantic colors are built from
 */
export const baseColors = {
  // Pure colors
  black: '#000000',
  white: '#ffffff',

  // Grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#0a0a0a',
  },

  // Indigo (Default primary)
  indigo: {
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
  },

  // Violet (Default secondary)
  violet: {
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
  },

  // Orange (Sunset theme)
  orange: {
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
  },

  // Pink (Sunset theme)
  pink: {
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
  },

  // Sky (Ocean theme)
  sky: {
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
  },

  // Emerald (Ocean theme + status)
  emerald: {
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
  },

  // Status colors
  red: {
    500: '#ef4444',
    600: '#dc2626',
  },

  amber: {
    500: '#f59e0b',
  },

  blue: {
    500: '#3b82f6',
  },
} as const;

/**
 * Semantic color definitions
 * Maps intent/purpose to actual colors
 */
export const semanticColors = {
  /**
   * Dark mode colors
   */
  dark: {
    // Backgrounds
    background: baseColors.black,
    surface: '#1a1a1a',
    elevated: '#242424',
    overlay: 'rgba(0, 0, 0, 0.8)',

    // Borders & Dividers
    border: '#383838',
    divider: '#2a2a2a',

    // Input fields
    input: {
      background: '#1f1f1f',
      border: '#383838',
      text: baseColors.gray[100],
      placeholder: baseColors.gray[500],
    },

    // Text colors
    text: {
      primary: baseColors.gray[100],
      secondary: baseColors.gray[300],
      tertiary: baseColors.gray[400],
      disabled: baseColors.gray[500],
      inverse: baseColors.black,
    },

    // Primary brand color (Indigo)
    primary: {
      default: baseColors.indigo[400],
      hover: baseColors.indigo[300],
      active: baseColors.indigo[500],
      light: baseColors.indigo[200],
      dark: baseColors.indigo[600],
      contrast: baseColors.white,
    },

    // Secondary accent color (Violet)
    secondary: {
      default: baseColors.violet[400],
      light: baseColors.violet[300],
      dark: baseColors.violet[500],
      contrast: baseColors.white,
    },

    // Status colors
    success: baseColors.emerald[500],
    warning: baseColors.amber[500],
    error: baseColors.red[500],
    info: baseColors.blue[500],

    // Semantic colors
    favorite: baseColors.red[500],
    like: baseColors.red[500],
    tag: baseColors.indigo[400],

    // Special UI elements
    skeleton: '#2a2a2a',
    shimmer: '#383838',
  },

  /**
   * Light mode colors
   */
  light: {
    // Backgrounds
    background: baseColors.white,
    surface: baseColors.gray[50],
    elevated: baseColors.white,
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Borders & Dividers
    border: baseColors.gray[200],
    divider: baseColors.gray[100],

    // Input fields
    input: {
      background: baseColors.white,
      border: baseColors.gray[300],
      text: baseColors.gray[900],
      placeholder: baseColors.gray[400],
    },

    // Text colors
    text: {
      primary: baseColors.gray[900],
      secondary: baseColors.gray[700],
      tertiary: baseColors.gray[500],
      disabled: baseColors.gray[400],
      inverse: baseColors.white,
    },

    // Primary brand color (Indigo)
    primary: {
      default: baseColors.indigo[500],
      hover: baseColors.indigo[600],
      active: baseColors.indigo[700],
      light: baseColors.indigo[400],
      dark: baseColors.indigo[800],
      contrast: baseColors.white,
    },

    // Secondary accent color (Violet)
    secondary: {
      default: baseColors.violet[500],
      light: baseColors.violet[400],
      dark: baseColors.violet[600],
      contrast: baseColors.white,
    },

    // Status colors
    success: baseColors.emerald[500],
    warning: baseColors.amber[500],
    error: baseColors.red[500],
    info: baseColors.blue[500],

    // Semantic colors
    favorite: baseColors.red[500],
    like: baseColors.red[500],
    tag: baseColors.indigo[500],

    // Special UI elements
    skeleton: baseColors.gray[200],
    shimmer: baseColors.gray[100],
  },
} as const;

/**
 * Type exports
 */
export type BaseColors = typeof baseColors;
export type SemanticColors = typeof semanticColors.dark;
export type ColorMode = 'light' | 'dark';
