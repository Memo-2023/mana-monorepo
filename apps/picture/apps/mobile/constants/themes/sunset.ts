import { ThemeDefinition } from './types';

/**
 * Sunset Theme (Orange/Pink)
 * Warm, creative design with orange-pink palette
 */
export const sunsetTheme: ThemeDefinition = {
  name: 'sunset',
  displayName: 'Sunset',

  // Dark Mode
  dark: {
    mode: 'dark',
    colors: {
      // Backgrounds
      background: '#0a0a0a',
      surface: '#1f1410',      // Warm dark brown
      elevated: '#2a1f1a',
      overlay: 'rgba(10, 10, 10, 0.8)',

      // Borders
      border: '#3d2f28',
      divider: '#2a1f1a',

      // Input
      input: {
        background: '#1a1410',
        border: '#3d2f28',
        text: '#fef3c7',       // amber-100
        placeholder: '#92400e', // amber-800
      },

      // Text
      text: {
        primary: '#fef3c7',    // amber-100
        secondary: '#fcd34d',  // amber-300
        tertiary: '#f59e0b',   // amber-500
        disabled: '#92400e',   // amber-800
        inverse: '#0a0a0a',
      },

      // Primary (Orange)
      primary: {
        default: '#fb923c',    // orange-400
        hover: '#fdba74',      // orange-300
        active: '#f97316',     // orange-500
        light: '#fed7aa',      // orange-200
        dark: '#ea580c',       // orange-600
        contrast: '#ffffff',
      },

      // Secondary (Pink)
      secondary: {
        default: '#f472b6',    // pink-400
        light: '#f9a8d4',      // pink-300
        dark: '#ec4899',       // pink-500
        contrast: '#ffffff',
      },

      // Status
      success: '#10b981',      // emerald-500
      warning: '#fbbf24',      // amber-400
      error: '#f43f5e',        // rose-500
      info: '#60a5fa',         // blue-400

      // Semantic
      favorite: '#f43f5e',     // rose-500
      like: '#f43f5e',         // rose-500
      tag: '#fb923c',          // orange-400

      // Special
      skeleton: '#2a1f1a',
      shimmer: '#3d2f28',
    },

    shadows: {
      sm: {
        shadowColor: '#fb923c',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#fb923c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
      },
      lg: {
        shadowColor: '#fb923c',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
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
      background: '#fff7ed',   // orange-50
      surface: '#ffffff',
      elevated: '#fffbeb',     // amber-50
      overlay: 'rgba(0, 0, 0, 0.5)',

      // Borders
      border: '#fed7aa',       // orange-200
      divider: '#ffedd5',      // orange-100

      // Input
      input: {
        background: '#ffffff',
        border: '#fdba74',     // orange-300
        text: '#7c2d12',       // orange-900
        placeholder: '#ea580c', // orange-600
      },

      // Text
      text: {
        primary: '#7c2d12',    // orange-900
        secondary: '#9a3412',  // orange-800
        tertiary: '#c2410c',   // orange-700
        disabled: '#fdba74',   // orange-300
        inverse: '#ffffff',
      },

      // Primary (Orange)
      primary: {
        default: '#f97316',    // orange-500
        hover: '#ea580c',      // orange-600
        active: '#c2410c',     // orange-700
        light: '#fb923c',      // orange-400
        dark: '#9a3412',       // orange-800
        contrast: '#ffffff',
      },

      // Secondary (Pink)
      secondary: {
        default: '#ec4899',    // pink-500
        light: '#f472b6',      // pink-400
        dark: '#db2777',       // pink-600
        contrast: '#ffffff',
      },

      // Status
      success: '#10b981',      // emerald-500
      warning: '#f59e0b',      // amber-500
      error: '#f43f5e',        // rose-500
      info: '#3b82f6',         // blue-500

      // Semantic
      favorite: '#f43f5e',     // rose-500
      like: '#f43f5e',         // rose-500
      tag: '#f97316',          // orange-500

      // Special
      skeleton: '#fed7aa',     // orange-200
      shimmer: '#ffedd5',      // orange-100
    },

    shadows: {
      sm: {
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
      },
      lg: {
        shadowColor: '#f97316',
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
