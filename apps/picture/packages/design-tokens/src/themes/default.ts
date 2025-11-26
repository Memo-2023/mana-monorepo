/**
 * @memoro/design-tokens - Default Theme
 *
 * Default theme with Indigo as primary color.
 * Professional, modern design.
 */

import { semanticColors } from '../colors';
import { shadows, opacity } from '../shadows';

export const defaultTheme = {
  name: 'default' as const,
  displayName: 'Indigo',

  colors: {
    light: semanticColors.light,
    dark: semanticColors.dark,
  },

  shadows,
  opacity,
} as const;

export type DefaultTheme = typeof defaultTheme;
