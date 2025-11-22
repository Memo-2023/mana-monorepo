import { Theme } from '~/types/theme';

export const defaultTheme: Theme = {
  name: 'default',
  displayName: 'Standard',
  description: 'Das klassische blaue Theme',
  light: {
    background: '110 125 140', // darker blue-gray pastel background
    foreground: '0 0 0', // pure black for maximum readability
    surface: '145 160 175', // lighter blue-gray pastel surface
    surfaceElevated: '175 185 200', // soft blue-gray pastel elevated
    muted: '243 244 246', // gray-100
    mutedForeground: '0 0 0', // pure black for muted text
    primary: '59 130 246', // blue-500
    primaryForeground: '255 255 255', // white
    secondary: '229 231 235', // gray-200
    secondaryForeground: '0 0 0', // pure black
    accent: '99 102 241', // indigo-500
    accentForeground: '255 255 255', // white
    destructive: '239 68 68', // red-500
    destructiveForeground: '255 255 255', // white
    border: '229 231 235', // gray-200
    input: '229 231 235', // gray-200
    ring: '59 130 246', // blue-500
  },
  dark: {
    background: '3 7 18', // slate-950
    foreground: '255 255 255', // pure white for maximum readability
    surface: '30 41 59', // slate-800 -> slate-700 (lighter)
    surfaceElevated: '51 65 85', // slate-700 -> slate-600 (even lighter)
    muted: '71 85 105', // slate-600 -> slate-500
    mutedForeground: '255 255 255', // pure white for muted text
    primary: '96 165 250', // blue-400
    primaryForeground: '0 0 0', // pure black
    secondary: '71 85 105', // slate-600 -> slate-500
    secondaryForeground: '255 255 255', // pure white
    accent: '129 140 248', // indigo-400
    accentForeground: '0 0 0', // pure black
    destructive: '248 113 113', // red-400
    destructiveForeground: '0 0 0', // pure black
    border: '71 85 105', // slate-600 -> slate-500 (lighter border)
    input: '51 65 85', // slate-600
    ring: '96 165 250', // blue-400
  },
};
