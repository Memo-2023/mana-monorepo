import type { A11ySettings, ContrastLevel, ColorblindMode } from './types';

/**
 * localStorage key suffix for A11y settings
 */
export const A11Y_STORAGE_KEY_SUFFIX = '-a11y';

/**
 * Default A11y settings
 */
export const DEFAULT_A11Y_SETTINGS: A11ySettings = {
	contrast: 'normal',
	colorblind: 'none',
	reduceMotion: false,
};

/**
 * Colorblind mode options for UI
 */
export const COLORBLIND_OPTIONS: readonly {
	value: ColorblindMode;
	label: string;
	description: string;
}[] = [
	{
		value: 'none',
		label: 'Keine',
		description: 'Standardfarben',
	},
	{
		value: 'deuteranopia',
		label: 'Deuteranopie',
		description: 'Rot-Grün-Schwäche (häufigste Form)',
	},
	{
		value: 'protanopia',
		label: 'Protanopie',
		description: 'Rot-Blindheit',
	},
	{
		value: 'monochrome',
		label: 'Monochrom',
		description: 'Graustufen',
	},
] as const;

/**
 * Contrast level options for UI
 */
export const CONTRAST_OPTIONS: readonly {
	value: ContrastLevel;
	label: string;
	description: string;
}[] = [
	{
		value: 'normal',
		label: 'Normal',
		description: 'Standard-Kontrast (WCAG AA)',
	},
	{
		value: 'high',
		label: 'Hoch',
		description: 'Erhöhter Kontrast (WCAG AAA)',
	},
] as const;

/**
 * High contrast transformation config
 * Adjusts lightness values to achieve WCAG AAA (7:1) contrast ratios
 */
export const HIGH_CONTRAST_CONFIG = {
	light: {
		/** Minimum lightness for backgrounds (push towards white) */
		backgroundLightnessMin: 95,
		/** Maximum lightness for foregrounds (push towards black) */
		foregroundLightnessMax: 15,
		/** How much to darken borders */
		borderDarken: 15,
		/** Minimum saturation boost for primary colors */
		primarySaturationMin: 70,
	},
	dark: {
		/** Maximum lightness for backgrounds (push towards black) */
		backgroundLightnessMax: 8,
		/** Minimum lightness for foregrounds (push towards white) */
		foregroundLightnessMin: 90,
		/** How much to lighten borders */
		borderLighten: 15,
		/** Minimum saturation boost for primary colors */
		primarySaturationMin: 70,
	},
} as const;

/**
 * Colorblind transformation configs
 * Hue shifts to make colors more distinguishable for each condition
 */
export const COLORBLIND_TRANSFORMS = {
	deuteranopia: {
		/** Shift problematic green hues towards blue */
		hueRangeStart: 80,
		hueRangeEnd: 160,
		hueShift: 60,
		saturationScale: 0.85,
	},
	protanopia: {
		/** Shift problematic red hues towards yellow */
		hueRangeStart: 0,
		hueRangeEnd: 30,
		hueShift: 30,
		/** Also handle wrap-around (330-360) */
		hueRangeStart2: 330,
		hueRangeEnd2: 360,
		saturationScale: 0.85,
	},
	monochrome: {
		/** Remove all saturation */
		saturationScale: 0,
	},
} as const;

/**
 * Default animation/transition durations
 */
export const MOTION_DEFAULTS = {
	/** Default animation duration in ms */
	animationDuration: 300,
	/** Default transition duration in ms */
	transitionDuration: 200,
	/** Reduced (0) for prefers-reduced-motion */
	reducedDuration: 0,
} as const;
