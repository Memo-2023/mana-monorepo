/**
 * @memoro/design-tokens - React Native Helpers
 *
 * Helper functions to use design tokens in React Native.
 */

import type { ColorMode, SemanticColors } from '../src/colors';
import type { ThemeVariant } from '../src/themes';
import { themes } from '../src/themes';
import { spacing, borderRadius } from '../src/spacing';
import { fontSize, fontWeight } from '../src/typography';

/**
 * Get theme colors for a specific variant and mode
 */
export function getThemeColors(
	variant: ThemeVariant = 'default',
	mode: ColorMode = 'dark'
): SemanticColors {
	const theme = themes[variant];
	return theme.colors[mode] as SemanticColors;
}

/**
 * Create a complete React Native theme object
 */
export function createNativeTheme(variant: ThemeVariant = 'default', mode: ColorMode = 'dark') {
	const theme = themes[variant];
	const colors = theme.colors[mode];
	const shadows = theme.shadows[mode];

	return {
		variant,
		mode,
		colors,
		spacing,
		borderRadius,
		fontSize,
		fontWeight,
		shadows,
		opacity: theme.opacity,
	} as const;
}

/**
 * Get all available theme variants
 */
export function getThemeVariants(): ThemeVariant[] {
	return Object.keys(themes) as ThemeVariant[];
}

/**
 * Check if a theme variant exists
 */
export function isValidThemeVariant(variant: string): variant is ThemeVariant {
	return variant in themes;
}

/**
 * Type exports
 */
export type NativeTheme = ReturnType<typeof createNativeTheme>;

// Re-export types for convenience
export type { ThemeVariant, ColorMode, SemanticColors };
