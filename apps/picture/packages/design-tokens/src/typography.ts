/**
 * @memoro/design-tokens - Typography
 *
 * Typography scale for font sizes, weights, and line heights.
 */

/**
 * Font size scale (in pixels)
 */
export const fontSize = {
	xs: 12,
	sm: 14,
	base: 16,
	lg: 18,
	xl: 20,
	'2xl': 24,
	'3xl': 30,
	'4xl': 36,
	'5xl': 48,
	'6xl': 60,
	'7xl': 72,
	'8xl': 96,
} as const;

/**
 * Font weights
 */
export const fontWeight = {
	regular: '400',
	medium: '500',
	semibold: '600',
	bold: '700',
} as const;

/**
 * Line heights
 */
export const lineHeight = {
	tight: 1.2,
	normal: 1.5,
	relaxed: 1.75,
	loose: 2,
} as const;

/**
 * Letter spacing (tracking)
 */
export const letterSpacing = {
	tighter: -0.05,
	tight: -0.025,
	normal: 0,
	wide: 0.025,
	wider: 0.05,
	widest: 0.1,
} as const;

/**
 * Type exports
 */
export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type LineHeight = typeof lineHeight;
export type LetterSpacing = typeof letterSpacing;
