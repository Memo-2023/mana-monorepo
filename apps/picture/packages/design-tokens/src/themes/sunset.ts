/**
 * @memoro/design-tokens - Sunset Theme
 *
 * Sunset theme with Orange/Pink palette.
 * Warm, creative design.
 */

import { baseColors, semanticColors } from '../colors';
import { shadows, opacity } from '../shadows';

export const sunsetTheme = {
  name: 'sunset' as const,
  displayName: 'Sunset',

  colors: {
    light: semanticColors.light, // Uses default light mode

    dark: {
      ...semanticColors.dark,

      // Override backgrounds for warmer tone
      background: '#0a0a0a',
      surface: '#1f1410',
      elevated: '#2a1f1a',

      // Override borders
      border: '#3d2f28',
      divider: '#2a1f1a',

      // Override input
      input: {
        background: '#1a1410',
        border: '#3d2f28',
        text: '#fef3c7', // amber-100
        placeholder: '#92400e', // amber-800
      },

      // Override text colors (warmer)
      text: {
        primary: '#fef3c7', // amber-100
        secondary: '#fcd34d', // amber-300
        tertiary: '#f59e0b', // amber-500
        disabled: '#92400e', // amber-800
        inverse: '#0a0a0a',
      },

      // Primary: Orange
      primary: {
        default: baseColors.orange[400],
        hover: baseColors.orange[300],
        active: baseColors.orange[500],
        light: '#fed7aa', // orange-200
        dark: baseColors.orange[600],
        contrast: baseColors.white,
      },

      // Secondary: Pink
      secondary: {
        default: baseColors.pink[400],
        light: baseColors.pink[300],
        dark: baseColors.pink[500],
        contrast: baseColors.white,
      },

      // Status
      success: baseColors.emerald[500],
      warning: '#fbbf24', // amber-400
      error: '#f43f5e', // rose-500
      info: '#60a5fa', // blue-400

      // Semantic
      favorite: '#f43f5e', // rose-500
      like: '#f43f5e', // rose-500
      tag: baseColors.orange[400],

      // Special
      skeleton: '#2a1f1a',
      shimmer: '#3d2f28',
    },
  },

  shadows,
  opacity,
} as const;

export type SunsetTheme = typeof sunsetTheme;
