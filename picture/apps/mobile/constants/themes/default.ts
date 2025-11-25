import { ThemeDefinition } from './types';

/**
 * Default Theme (Indigo)
 * Modern, professional design with indigo as primary color
 */
export const defaultTheme: ThemeDefinition = {
  name: 'default',
  displayName: 'Indigo',

  // Dark Mode
  dark: {
    mode: 'dark',
    colors: {
      // Backgrounds
      background: '#000000',
      surface: '#1a1a1a',
      elevated: '#242424',
      overlay: 'rgba(0, 0, 0, 0.8)',

      // Borders
      border: '#383838',
      divider: '#2a2a2a',

      // Input
      input: {
        background: '#1f1f1f',
        border: '#383838',
        text: '#f3f4f6',
        placeholder: '#6b7280',
      },

      // Text
      text: {
        primary: '#f3f4f6',    // gray-100
        secondary: '#d1d5db',  // gray-300
        tertiary: '#9ca3af',   // gray-400
        disabled: '#6b7280',   // gray-500
        inverse: '#000000',
      },

      // Primary (Indigo)
      primary: {
        default: '#818cf8',    // indigo-400
        hover: '#a5b4fc',      // indigo-300
        active: '#6366f1',     // indigo-500
        light: '#c7d2fe',      // indigo-200
        dark: '#4f46e5',       // indigo-600
        contrast: '#ffffff',
      },

      // Secondary (Violet)
      secondary: {
        default: '#a78bfa',    // violet-400
        light: '#c4b5fd',      // violet-300
        dark: '#8b5cf6',       // violet-500
        contrast: '#ffffff',
      },

      // Status
      success: '#10b981',      // emerald-500
      warning: '#f59e0b',      // amber-500
      error: '#ef4444',        // red-500
      info: '#3b82f6',         // blue-500

      // Semantic
      favorite: '#ef4444',     // red-500
      like: '#ef4444',         // red-500
      tag: '#818cf8',          // indigo-400

      // Special
      skeleton: '#2a2a2a',
      shimmer: '#383838',
    },

    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 8,
      },
    },

    opacity: {
      disabled: 0.5,
      overlay: 0.8,
      hover: 0.9,
      pressed: 0.7,
    },
  },

  // Light Mode
  light: {
    mode: 'light',
    colors: {
      // Backgrounds
      background: '#ffffff',
      surface: '#f9fafb',      // gray-50
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)',

      // Borders
      border: '#e5e7eb',       // gray-200
      divider: '#f3f4f6',      // gray-100

      // Input
      input: {
        background: '#ffffff',
        border: '#d1d5db',     // gray-300
        text: '#111827',       // gray-900
        placeholder: '#9ca3af', // gray-400
      },

      // Text
      text: {
        primary: '#111827',    // gray-900
        secondary: '#374151',  // gray-700
        tertiary: '#6b7280',   // gray-500
        disabled: '#9ca3af',   // gray-400
        inverse: '#ffffff',
      },

      // Primary (Indigo)
      primary: {
        default: '#6366f1',    // indigo-500
        hover: '#4f46e5',      // indigo-600
        active: '#4338ca',     // indigo-700
        light: '#818cf8',      // indigo-400
        dark: '#3730a3',       // indigo-800
        contrast: '#ffffff',
      },

      // Secondary (Violet)
      secondary: {
        default: '#8b5cf6',    // violet-500
        light: '#a78bfa',      // violet-400
        dark: '#7c3aed',       // violet-600
        contrast: '#ffffff',
      },

      // Status
      success: '#10b981',      // emerald-500
      warning: '#f59e0b',      // amber-500
      error: '#ef4444',        // red-500
      info: '#3b82f6',         // blue-500

      // Semantic
      favorite: '#ef4444',     // red-500
      like: '#ef4444',         // red-500
      tag: '#6366f1',          // indigo-500

      // Special
      skeleton: '#e5e7eb',     // gray-200
      shimmer: '#f3f4f6',      // gray-100
    },

    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
      },
    },

    opacity: {
      disabled: 0.5,
      overlay: 0.5,
      hover: 0.9,
      pressed: 0.7,
    },
  },
};
