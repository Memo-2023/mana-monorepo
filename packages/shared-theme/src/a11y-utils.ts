import type { ThemeColors, EffectiveMode, HSLValue, ColorblindMode, A11ySettings } from './types';
import { parseHSL, createHSL, isBrowser } from './utils';
import { HIGH_CONTRAST_CONFIG, COLORBLIND_TRANSFORMS, MOTION_DEFAULTS } from './a11y-constants';

// ============================================================================
// Reduced Motion
// ============================================================================

/**
 * Check if system prefers reduced motion
 */
export function getSystemReducedMotion(): boolean {
	if (!isBrowser()) return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Create a media query listener for reduced motion preference changes
 */
export function createReducedMotionListener(callback: (reduces: boolean) => void): () => void {
	if (!isBrowser()) return () => {};

	const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

	const handler = (e: MediaQueryListEvent) => callback(e.matches);

	mediaQuery.addEventListener('change', handler);
	return () => mediaQuery.removeEventListener('change', handler);
}

/**
 * Apply motion settings to document
 */
export function applyMotionSettings(reduceMotion: boolean): void {
	if (!isBrowser()) return;

	const root = document.documentElement;

	if (reduceMotion) {
		root.setAttribute('data-reduce-motion', 'true');
		root.style.setProperty('--animation-duration', `${MOTION_DEFAULTS.reducedDuration}ms`);
		root.style.setProperty('--transition-duration', `${MOTION_DEFAULTS.reducedDuration}ms`);
	} else {
		root.removeAttribute('data-reduce-motion');
		root.style.setProperty('--animation-duration', `${MOTION_DEFAULTS.animationDuration}ms`);
		root.style.setProperty('--transition-duration', `${MOTION_DEFAULTS.transitionDuration}ms`);
	}
}

// ============================================================================
// High Contrast Transformations
// ============================================================================

/**
 * Color role classification for contrast adjustments
 */
type ColorRole = 'background' | 'foreground' | 'border' | 'primary' | 'semantic' | 'other';

/**
 * Get the role of a color based on its key
 */
function getColorRole(colorKey: keyof ThemeColors): ColorRole {
	const backgrounds = [
		'background',
		'surface',
		'surfaceHover',
		'surfaceElevated',
		'muted',
		'input',
	];
	const foregrounds = ['foreground', 'primaryForeground', 'secondaryForeground', 'mutedForeground'];
	const borders = ['border', 'borderStrong', 'ring'];
	const primaries = ['primary', 'secondary'];
	const semantics = ['error', 'success', 'warning'];

	if (backgrounds.includes(colorKey)) return 'background';
	if (foregrounds.includes(colorKey)) return 'foreground';
	if (borders.includes(colorKey)) return 'border';
	if (primaries.includes(colorKey)) return 'primary';
	if (semantics.includes(colorKey)) return 'semantic';
	return 'other';
}

/**
 * Apply high contrast transformation to a single color
 */
function applyHighContrastToColor(
	hsl: HSLValue,
	colorKey: keyof ThemeColors,
	mode: EffectiveMode
): HSLValue {
	const { h, s, l } = parseHSL(hsl);
	const role = getColorRole(colorKey);

	let newL = l;
	let newS = s;

	if (mode === 'light') {
		const config = HIGH_CONTRAST_CONFIG.light;
		switch (role) {
			case 'background':
				newL = Math.max(l, config.backgroundLightnessMin);
				break;
			case 'foreground':
				newL = Math.min(l, config.foregroundLightnessMax);
				break;
			case 'border':
				newL = Math.max(0, l - config.borderDarken);
				break;
			case 'primary':
			case 'semantic':
				newS = Math.max(s, config.primarySaturationMin);
				newL = Math.min(l, 45);
				break;
		}
	} else {
		const config = HIGH_CONTRAST_CONFIG.dark;
		switch (role) {
			case 'background':
				newL = Math.min(l, config.backgroundLightnessMax);
				break;
			case 'foreground':
				newL = Math.max(l, config.foregroundLightnessMin);
				break;
			case 'border':
				newL = Math.min(100, l + config.borderLighten);
				break;
			case 'primary':
			case 'semantic':
				newS = Math.max(s, config.primarySaturationMin);
				newL = Math.max(l, 55);
				break;
		}
	}

	return createHSL(h, newS, newL);
}

/**
 * Apply high contrast transformations to all theme colors
 */
export function applyHighContrast(colors: ThemeColors, mode: EffectiveMode): ThemeColors {
	const result = { ...colors };

	for (const key of Object.keys(colors) as (keyof ThemeColors)[]) {
		result[key] = applyHighContrastToColor(colors[key], key, mode);
	}

	return result;
}

// ============================================================================
// Colorblind Transformations
// ============================================================================

/**
 * Shift hue within a range
 */
function shiftHueInRange(h: number, rangeStart: number, rangeEnd: number, shift: number): number {
	if (h >= rangeStart && h <= rangeEnd) {
		return (h + shift) % 360;
	}
	return h;
}

/**
 * Apply colorblind transformation to a single color
 */
function applyColorblindToColor(hsl: HSLValue, mode: ColorblindMode): HSLValue {
	if (mode === 'none') return hsl;

	const { h, s, l } = parseHSL(hsl);

	if (mode === 'monochrome') {
		// Full grayscale - remove all saturation
		return createHSL(h, 0, l);
	}

	if (mode === 'deuteranopia') {
		const config = COLORBLIND_TRANSFORMS.deuteranopia;
		const newH = shiftHueInRange(h, config.hueRangeStart, config.hueRangeEnd, config.hueShift);
		const newS = s * config.saturationScale;
		return createHSL(newH, newS, l);
	}

	if (mode === 'protanopia') {
		const config = COLORBLIND_TRANSFORMS.protanopia;
		let newH = shiftHueInRange(h, config.hueRangeStart, config.hueRangeEnd, config.hueShift);
		// Also handle wrap-around reds (330-360)
		newH = shiftHueInRange(newH, config.hueRangeStart2, config.hueRangeEnd2, config.hueShift);
		const newS = s * config.saturationScale;
		return createHSL(newH, newS, l);
	}

	return hsl;
}

/**
 * Apply colorblind transformations to all theme colors
 */
export function applyColorblindTransform(colors: ThemeColors, mode: ColorblindMode): ThemeColors {
	if (mode === 'none') return colors;

	const result = { ...colors };

	for (const key of Object.keys(colors) as (keyof ThemeColors)[]) {
		result[key] = applyColorblindToColor(colors[key], mode);
	}

	return result;
}

// ============================================================================
// Combined A11y Application
// ============================================================================

/**
 * Apply all A11y transformations to theme colors
 */
export function applyA11yTransformations(
	colors: ThemeColors,
	mode: EffectiveMode,
	a11ySettings: A11ySettings
): ThemeColors {
	let result = { ...colors };

	// Apply high contrast first (if enabled)
	if (a11ySettings.contrast === 'high') {
		result = applyHighContrast(result, mode);
	}

	// Apply colorblind transformation
	if (a11ySettings.colorblind !== 'none') {
		result = applyColorblindTransform(result, a11ySettings.colorblind);
	}

	return result;
}

/**
 * Apply A11y data attributes to document
 */
export function applyA11yAttributes(a11ySettings: A11ySettings): void {
	if (!isBrowser()) return;

	const root = document.documentElement;

	// Contrast level
	if (a11ySettings.contrast === 'high') {
		root.setAttribute('data-contrast', 'high');
	} else {
		root.removeAttribute('data-contrast');
	}

	// Colorblind mode
	if (a11ySettings.colorblind !== 'none') {
		root.setAttribute('data-colorblind', a11ySettings.colorblind);
	} else {
		root.removeAttribute('data-colorblind');
	}

	// Motion settings
	applyMotionSettings(a11ySettings.reduceMotion);
}

// ============================================================================
// Storage
// ============================================================================

/**
 * Load A11y settings from localStorage
 */
export function loadA11yFromStorage(storageKey: string): Partial<A11ySettings> | null {
	if (!isBrowser()) return null;

	try {
		const stored = localStorage.getItem(storageKey);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (e) {
		console.warn('Failed to load A11y settings from storage:', e);
	}

	return null;
}

/**
 * Save A11y settings to localStorage
 */
export function saveA11yToStorage(storageKey: string, settings: A11ySettings): void {
	if (!isBrowser()) return;

	try {
		localStorage.setItem(storageKey, JSON.stringify(settings));
	} catch (e) {
		console.warn('Failed to save A11y settings to storage:', e);
	}
}
