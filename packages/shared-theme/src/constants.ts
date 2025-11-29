import type { ThemeVariant, ThemeVariantDefinition, ThemeColors } from './types';

/**
 * All available theme variants
 */
export const THEME_VARIANTS: readonly ThemeVariant[] = [
	'lume',
	'nature',
	'stone',
	'ocean',
] as const;

/**
 * HSL Color Definitions for all theme variants
 *
 * Format: "H S% L%" (without hsl() wrapper for CSS variable compatibility)
 *
 * Color tokens:
 * - primary: Main brand/accent color
 * - secondary: Secondary accent
 * - background: Page background
 * - foreground: Main text color
 * - surface: Card/content background
 * - muted: Disabled/subtle elements
 * - border: Border colors
 * - error/success/warning: Semantic colors
 */

const lumeLight: ThemeColors = {
	primary: '47 95% 58%', // #f8d62b - Gold
	primaryForeground: '0 0% 0%', // Black text on gold
	secondary: '47 100% 41%', // #D4B200 - Darker gold
	secondaryForeground: '0 0% 0%',
	background: '45 30% 96%', // Warm cream with gold tint
	foreground: '0 0% 17%', // #2c2c2c - Dark text
	surface: '0 0% 100%', // #ffffff - White
	surfaceHover: '0 0% 96%', // #f5f5f5
	surfaceElevated: '0 0% 100%', // #ffffff
	muted: '0 0% 90%', // #e6e6e6
	mutedForeground: '0 0% 40%', // #666666
	border: '0 0% 90%', // #e6e6e6
	borderStrong: '0 0% 80%', // #cccccc
	error: '6 78% 57%', // #e74c3c
	success: '145 63% 42%', // #27ae60
	warning: '36 100% 50%', // #f39c12
	input: '0 0% 100%', // #ffffff
	ring: '47 95% 58%', // Same as primary
};

const lumeDark: ThemeColors = {
	primary: '47 95% 58%', // #f8d62b - Gold (same in dark)
	primaryForeground: '0 0% 0%', // Black text on gold
	secondary: '47 70% 29%', // #7C6B16 - Muted gold
	secondaryForeground: '0 0% 100%',
	background: '40 10% 7%', // Very dark with warm tint
	foreground: '0 0% 100%', // #ffffff - White text
	surface: '40 8% 12%', // Dark surface with warm tint
	surfaceHover: '40 8% 16%',
	surfaceElevated: '40 8% 14%',
	muted: '40 6% 20%',
	mutedForeground: '40 5% 60%',
	border: '40 6% 26%',
	borderStrong: '40 5% 35%',
	error: '6 78% 57%', // #e74c3c
	success: '145 63% 49%', // #2ecc71
	warning: '48 100% 50%', // #f1c40f
	input: '0 0% 14%', // #242424
	ring: '47 95% 58%',
};

const natureLight: ThemeColors = {
	primary: '122 39% 49%', // #4CAF50 - Green
	primaryForeground: '0 0% 100%', // White text on green
	secondary: '122 38% 63%', // #81C784 - Light green
	secondaryForeground: '0 0% 0%',
	background: '80 33% 97%', // #FBFDF8 - Very light green tint
	foreground: '122 56% 24%', // #1B5E20 - Dark green text
	surface: '0 0% 100%', // #ffffff
	surfaceHover: '120 25% 95%', // #F1F8E9
	surfaceElevated: '0 0% 100%',
	muted: '120 25% 95%', // #F1F8E9
	mutedForeground: '122 20% 40%',
	border: '120 25% 91%', // #E8F5E9
	borderStrong: '120 26% 79%', // #C8E6C9
	error: '0 65% 67%', // #E57373
	success: '122 39% 49%', // Same as primary
	warning: '36 100% 50%',
	input: '0 0% 100%',
	ring: '122 39% 49%',
};

const natureDark: ThemeColors = {
	primary: '122 39% 49%', // #4CAF50
	primaryForeground: '0 0% 100%',
	secondary: '122 30% 35%', // Muted green
	secondaryForeground: '0 0% 100%',
	background: '120 12% 6%', // Very dark with green tint
	foreground: '0 0% 100%', // White
	surface: '120 10% 11%', // Slight green tint
	surfaceHover: '120 10% 15%',
	surfaceElevated: '120 10% 13%',
	muted: '120 10% 19%',
	mutedForeground: '120 10% 60%',
	border: '120 10% 24%',
	borderStrong: '120 10% 34%',
	error: '0 65% 57%',
	success: '122 50% 55%',
	warning: '48 100% 50%',
	input: '120 10% 14%',
	ring: '122 39% 49%',
};

const stoneLight: ThemeColors = {
	primary: '200 18% 46%', // #607D8B - Blue gray
	primaryForeground: '0 0% 100%',
	secondary: '200 15% 62%', // #90A4AE - Light slate
	secondaryForeground: '0 0% 0%',
	background: '210 17% 97%', // #F5F7F9 - Very light blue gray
	foreground: '200 19% 18%', // #263238 - Dark slate
	surface: '0 0% 100%',
	surfaceHover: '200 10% 94%', // #ECEFF1
	surfaceElevated: '0 0% 100%',
	muted: '200 10% 94%', // #ECEFF1
	mutedForeground: '200 10% 45%',
	border: '200 10% 88%', // #CFD8DC
	borderStrong: '200 12% 75%', // #B0BEC5
	error: '4 90% 63%', // #EF5350
	success: '145 63% 42%',
	warning: '36 100% 50%',
	input: '0 0% 100%',
	ring: '200 18% 46%',
};

const stoneDark: ThemeColors = {
	primary: '200 15% 52%', // #78909C - Lighter in dark mode
	primaryForeground: '0 0% 0%',
	secondary: '200 12% 35%',
	secondaryForeground: '0 0% 100%',
	background: '210 15% 8%', // Very dark with blue-gray tint
	foreground: '0 0% 100%',
	surface: '200 12% 12%',
	surfaceHover: '200 12% 16%',
	surfaceElevated: '200 12% 14%',
	muted: '200 10% 20%',
	mutedForeground: '200 10% 60%',
	border: '200 10% 25%',
	borderStrong: '200 10% 35%',
	error: '4 90% 58%',
	success: '145 63% 49%',
	warning: '48 100% 50%',
	input: '200 10% 14%',
	ring: '200 15% 52%',
};

const oceanLight: ThemeColors = {
	primary: '199 98% 45%', // #039BE5 - Bright blue
	primaryForeground: '0 0% 100%',
	secondary: '199 92% 64%', // #4FC3F7 - Light blue
	secondaryForeground: '0 0% 0%',
	background: '199 100% 97%', // #F5FCFF - Very light blue
	foreground: '199 100% 18%', // #01579B - Dark blue
	surface: '0 0% 100%',
	surfaceHover: '199 100% 94%', // #E1F5FE
	surfaceElevated: '0 0% 100%',
	muted: '199 100% 94%', // #E1F5FE
	mutedForeground: '199 50% 40%',
	border: '199 71% 87%', // #B3E5FC
	borderStrong: '199 79% 76%', // #81D4FA
	error: '4 90% 63%', // #EF5350
	success: '145 63% 42%',
	warning: '36 100% 50%',
	input: '0 0% 100%',
	ring: '199 98% 45%',
};

const oceanDark: ThemeColors = {
	primary: '199 98% 48%', // Slightly brighter in dark
	primaryForeground: '0 0% 0%',
	secondary: '199 60% 35%',
	secondaryForeground: '0 0% 100%',
	background: '200 25% 7%', // Very dark with blue tint
	foreground: '0 0% 100%',
	surface: '199 20% 11%', // Slight blue tint
	surfaceHover: '199 20% 15%',
	surfaceElevated: '199 20% 13%',
	muted: '199 15% 19%',
	mutedForeground: '199 15% 60%',
	border: '199 15% 24%',
	borderStrong: '199 15% 34%',
	error: '4 90% 58%',
	success: '145 63% 49%',
	warning: '48 100% 50%',
	input: '199 30% 14%',
	ring: '199 98% 48%',
};

/**
 * Complete theme variant definitions
 */
export const THEME_DEFINITIONS: Record<ThemeVariant, ThemeVariantDefinition> = {
	lume: {
		name: 'lume',
		label: 'Lume',
		emoji: '✨',
		icon: 'sparkle',
		hue: 47,
		light: lumeLight,
		dark: lumeDark,
	},
	nature: {
		name: 'nature',
		label: 'Nature',
		emoji: '🌿',
		icon: 'leaf',
		hue: 122,
		light: natureLight,
		dark: natureDark,
	},
	stone: {
		name: 'stone',
		label: 'Stone',
		emoji: '🪨',
		icon: 'hexagon',
		hue: 200,
		light: stoneLight,
		dark: stoneDark,
	},
	ocean: {
		name: 'ocean',
		label: 'Ocean',
		emoji: '🌊',
		icon: 'waves',
		hue: 199,
		light: oceanLight,
		dark: oceanDark,
	},
};

/**
 * Default theme configuration
 */
export const DEFAULT_MODE = 'system' as const;
export const DEFAULT_VARIANT = 'lume' as const;

/**
 * CSS variable prefix
 */
export const CSS_VAR_PREFIX = '--color' as const;

/**
 * LocalStorage key suffix
 */
export const STORAGE_KEY_SUFFIX = '-theme' as const;
