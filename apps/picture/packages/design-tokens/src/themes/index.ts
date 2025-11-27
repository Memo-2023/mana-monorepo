/**
 * @memoro/design-tokens - Themes
 *
 * Theme variants with different color palettes.
 * All themes support both light and dark modes.
 */

export * from './default';
export * from './sunset';
export * from './ocean';

import { defaultTheme } from './default';
import { sunsetTheme } from './sunset';
import { oceanTheme } from './ocean';

/**
 * All available themes
 */
export const themes = {
	default: defaultTheme,
	sunset: sunsetTheme,
	ocean: oceanTheme,
} as const;

/**
 * Type exports
 */
export type ThemeVariant = keyof typeof themes;
export type ThemeMode = 'light' | 'dark';
export type Theme = typeof defaultTheme | typeof sunsetTheme | typeof oceanTheme;
