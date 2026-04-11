import type { ThemeVariant, ThemeVariantDefinition, ThemeColors } from './types';

/**
 * All available theme variants
 */
export const THEME_VARIANTS: readonly ThemeVariant[] = [
	'lume',
	'nature',
	'stone',
	'ocean',
	'sunset',
	'midnight',
	'rose',
	'lavender',
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

// ============================================================================
// Extended Themes: Sunset, Midnight, Rose, Lavender
// ============================================================================

const sunsetLight: ThemeColors = {
	primary: '15 90% 55%', // Coral/Orange
	primaryForeground: '0 0% 100%',
	secondary: '25 100% 60%', // Warm orange
	secondaryForeground: '0 0% 0%',
	background: '30 50% 97%', // Warm cream
	foreground: '15 50% 20%', // Dark warm brown
	surface: '0 0% 100%',
	surfaceHover: '30 40% 95%',
	surfaceElevated: '0 0% 100%',
	muted: '30 30% 93%',
	mutedForeground: '15 20% 45%',
	border: '30 25% 88%',
	borderStrong: '30 30% 75%',
	error: '0 72% 55%',
	success: '145 63% 42%',
	warning: '36 100% 50%',
	input: '0 0% 100%',
	ring: '15 90% 55%',
};

const sunsetDark: ThemeColors = {
	primary: '15 85% 58%', // Brighter coral in dark
	primaryForeground: '0 0% 0%',
	secondary: '25 60% 35%',
	secondaryForeground: '0 0% 100%',
	background: '15 20% 8%', // Dark with warm tint
	foreground: '0 0% 100%',
	surface: '15 15% 12%',
	surfaceHover: '15 15% 16%',
	surfaceElevated: '15 15% 14%',
	muted: '15 12% 20%',
	mutedForeground: '15 10% 60%',
	border: '15 12% 25%',
	borderStrong: '15 12% 35%',
	error: '0 72% 55%',
	success: '145 63% 49%',
	warning: '48 100% 50%',
	input: '15 20% 14%',
	ring: '15 85% 58%',
};

const midnightLight: ThemeColors = {
	primary: '260 70% 55%', // Deep purple/violet
	primaryForeground: '0 0% 100%',
	secondary: '270 60% 70%', // Lighter purple
	secondaryForeground: '0 0% 0%',
	background: '260 30% 97%', // Very light purple tint
	foreground: '260 50% 20%', // Dark purple text
	surface: '0 0% 100%',
	surfaceHover: '260 25% 95%',
	surfaceElevated: '0 0% 100%',
	muted: '260 20% 93%',
	mutedForeground: '260 20% 45%',
	border: '260 20% 88%',
	borderStrong: '260 25% 75%',
	error: '0 72% 55%',
	success: '145 63% 42%',
	warning: '36 100% 50%',
	input: '0 0% 100%',
	ring: '260 70% 55%',
};

const midnightDark: ThemeColors = {
	primary: '260 65% 60%', // Brighter purple in dark
	primaryForeground: '0 0% 100%',
	secondary: '270 40% 35%',
	secondaryForeground: '0 0% 100%',
	background: '260 25% 7%', // Deep dark purple
	foreground: '0 0% 100%',
	surface: '260 20% 11%',
	surfaceHover: '260 20% 15%',
	surfaceElevated: '260 20% 13%',
	muted: '260 15% 19%',
	mutedForeground: '260 12% 60%',
	border: '260 15% 24%',
	borderStrong: '260 15% 34%',
	error: '0 72% 55%',
	success: '145 63% 49%',
	warning: '48 100% 50%',
	input: '260 25% 14%',
	ring: '260 65% 60%',
};

const roseLight: ThemeColors = {
	primary: '340 80% 55%', // Pink/Magenta
	primaryForeground: '0 0% 100%',
	secondary: '350 70% 70%', // Lighter pink
	secondaryForeground: '0 0% 0%',
	background: '340 40% 97%', // Very light pink tint
	foreground: '340 50% 20%', // Dark rose text
	surface: '0 0% 100%',
	surfaceHover: '340 30% 95%',
	surfaceElevated: '0 0% 100%',
	muted: '340 25% 93%',
	mutedForeground: '340 20% 45%',
	border: '340 25% 88%',
	borderStrong: '340 30% 75%',
	error: '0 72% 55%',
	success: '145 63% 42%',
	warning: '36 100% 50%',
	input: '0 0% 100%',
	ring: '340 80% 55%',
};

const roseDark: ThemeColors = {
	primary: '340 75% 60%', // Brighter pink in dark
	primaryForeground: '0 0% 100%',
	secondary: '350 45% 35%',
	secondaryForeground: '0 0% 100%',
	background: '340 20% 8%', // Dark with pink tint
	foreground: '0 0% 100%',
	surface: '340 15% 12%',
	surfaceHover: '340 15% 16%',
	surfaceElevated: '340 15% 14%',
	muted: '340 12% 20%',
	mutedForeground: '340 10% 60%',
	border: '340 12% 25%',
	borderStrong: '340 12% 35%',
	error: '0 72% 55%',
	success: '145 63% 49%',
	warning: '48 100% 50%',
	input: '340 20% 14%',
	ring: '340 75% 60%',
};

const lavenderLight: ThemeColors = {
	primary: '270 60% 60%', // Lavender/Light purple
	primaryForeground: '0 0% 100%',
	secondary: '280 50% 75%', // Softer purple
	secondaryForeground: '0 0% 0%',
	background: '270 35% 97%', // Very light lavender
	foreground: '270 40% 22%', // Dark lavender text
	surface: '0 0% 100%',
	surfaceHover: '270 25% 95%',
	surfaceElevated: '0 0% 100%',
	muted: '270 20% 93%',
	mutedForeground: '270 18% 45%',
	border: '270 20% 88%',
	borderStrong: '270 25% 78%',
	error: '0 72% 55%',
	success: '145 63% 42%',
	warning: '36 100% 50%',
	input: '0 0% 100%',
	ring: '270 60% 60%',
};

const lavenderDark: ThemeColors = {
	primary: '270 55% 65%', // Brighter lavender in dark
	primaryForeground: '0 0% 0%',
	secondary: '280 35% 38%',
	secondaryForeground: '0 0% 100%',
	background: '270 20% 8%', // Dark with lavender tint
	foreground: '0 0% 100%',
	surface: '270 15% 12%',
	surfaceHover: '270 15% 16%',
	surfaceElevated: '270 15% 14%',
	muted: '270 12% 20%',
	mutedForeground: '270 10% 60%',
	border: '270 12% 25%',
	borderStrong: '270 12% 35%',
	error: '0 72% 55%',
	success: '145 63% 49%',
	warning: '48 100% 50%',
	input: '270 20% 14%',
	ring: '270 55% 65%',
};

/**
 * Complete theme variant definitions
 *
 * Each theme can also carry a `paper` descriptor — a tileable texture
 * the workbench page-shell uses as a grain overlay. Swap the filename
 * here to change the texture for a whole theme in one place. Assets
 * live under `apps/<app>/static/textures/paper/` and are CC0-licensed
 * (see that directory's LICENSE.txt for provenance).
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
		paper: {
			url: '/textures/paper/paper-001.jpg',
			blendMode: 'multiply',
			opacityLight: 0.4,
			opacityDark: 0.18,
		},
	},
	nature: {
		name: 'nature',
		label: 'Nature',
		emoji: '🌿',
		icon: 'leaf',
		hue: 122,
		light: natureLight,
		dark: natureDark,
		paper: {
			url: '/textures/paper/cardboard-001.jpg',
			blendMode: 'multiply',
			opacityLight: 0.32,
			opacityDark: 0.14,
		},
	},
	stone: {
		name: 'stone',
		label: 'Stone',
		emoji: '🪨',
		icon: 'hexagon',
		hue: 200,
		light: stoneLight,
		dark: stoneDark,
		paper: {
			url: '/textures/paper/paper-005.jpg',
			blendMode: 'multiply',
			opacityLight: 0.35,
			opacityDark: 0.15,
		},
	},
	ocean: {
		name: 'ocean',
		label: 'Ocean',
		emoji: '🌊',
		icon: 'waves',
		hue: 199,
		light: oceanLight,
		dark: oceanDark,
		paper: {
			url: '/textures/paper/paper-003.jpg',
			blendMode: 'multiply',
			opacityLight: 0.3,
			opacityDark: 0.12,
		},
	},
	// Extended themes (not in PillNav by default, can be pinned)
	sunset: {
		name: 'sunset',
		label: 'Sunset',
		emoji: '🌅',
		icon: 'sun',
		hue: 15,
		light: sunsetLight,
		dark: sunsetDark,
		paper: {
			url: '/textures/paper/paper-006.jpg',
			blendMode: 'multiply',
			opacityLight: 0.38,
			opacityDark: 0.16,
		},
	},
	midnight: {
		name: 'midnight',
		label: 'Midnight',
		emoji: '🌙',
		icon: 'moon',
		hue: 260,
		light: midnightLight,
		dark: midnightDark,
		paper: {
			url: '/textures/paper/paper-004.jpg',
			blendMode: 'overlay',
			opacityLight: 0.35,
			opacityDark: 0.22,
		},
	},
	rose: {
		name: 'rose',
		label: 'Rose',
		emoji: '🌹',
		icon: 'flower',
		hue: 340,
		light: roseLight,
		dark: roseDark,
		paper: {
			url: '/textures/paper/paper-002.jpg',
			blendMode: 'multiply',
			opacityLight: 0.32,
			opacityDark: 0.14,
		},
	},
	lavender: {
		name: 'lavender',
		label: 'Lavender',
		emoji: '💜',
		icon: 'sparkle',
		hue: 270,
		light: lavenderLight,
		dark: lavenderDark,
		paper: {
			url: '/textures/paper/cardboard-002.jpg',
			blendMode: 'soft-light',
			opacityLight: 0.4,
			opacityDark: 0.18,
		},
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
