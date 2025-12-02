import type { ThemeColors, ThemeVariant, EffectiveMode, HSLValue, A11ySettings } from './types';
import { THEME_DEFINITIONS, CSS_VAR_PREFIX } from './constants';
import { applyA11yTransformations, applyA11yAttributes } from './a11y-utils';

/**
 * Check if code is running in browser
 */
export function isBrowser(): boolean {
	return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Get system color scheme preference
 */
export function getSystemPreference(): EffectiveMode {
	if (!isBrowser()) return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Create a media query listener for system preference changes
 */
export function createSystemPreferenceListener(callback: (isDark: boolean) => void): () => void {
	if (!isBrowser()) return () => {};

	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

	const handler = (e: MediaQueryListEvent) => callback(e.matches);

	// Modern browsers
	if (mediaQuery.addEventListener) {
		mediaQuery.addEventListener('change', handler);
		return () => mediaQuery.removeEventListener('change', handler);
	}

	// Legacy browsers
	mediaQuery.addListener(handler);
	return () => mediaQuery.removeListener(handler);
}

/**
 * Get colors for a specific variant and mode
 */
export function getThemeColors(
	variant: ThemeVariant,
	mode: EffectiveMode,
	primaryOverride?: { light: HSLValue; dark: HSLValue }
): ThemeColors {
	const definition = THEME_DEFINITIONS[variant];
	const colors = mode === 'dark' ? { ...definition.dark } : { ...definition.light };

	// Apply app-specific primary color override
	if (primaryOverride) {
		const overrideColor = mode === 'dark' ? primaryOverride.dark : primaryOverride.light;
		colors.primary = overrideColor;
		colors.ring = overrideColor;
	}

	return colors;
}

/**
 * Convert ThemeColors to CSS variables object
 */
export function colorsToCssVars(colors: ThemeColors): Record<string, string> {
	return {
		[`${CSS_VAR_PREFIX}-primary`]: colors.primary,
		[`${CSS_VAR_PREFIX}-primary-foreground`]: colors.primaryForeground,
		[`${CSS_VAR_PREFIX}-secondary`]: colors.secondary,
		[`${CSS_VAR_PREFIX}-secondary-foreground`]: colors.secondaryForeground,
		[`${CSS_VAR_PREFIX}-background`]: colors.background,
		[`${CSS_VAR_PREFIX}-foreground`]: colors.foreground,
		[`${CSS_VAR_PREFIX}-surface`]: colors.surface,
		[`${CSS_VAR_PREFIX}-surface-hover`]: colors.surfaceHover,
		[`${CSS_VAR_PREFIX}-surface-elevated`]: colors.surfaceElevated,
		[`${CSS_VAR_PREFIX}-muted`]: colors.muted,
		[`${CSS_VAR_PREFIX}-muted-foreground`]: colors.mutedForeground,
		[`${CSS_VAR_PREFIX}-border`]: colors.border,
		[`${CSS_VAR_PREFIX}-border-strong`]: colors.borderStrong,
		[`${CSS_VAR_PREFIX}-error`]: colors.error,
		[`${CSS_VAR_PREFIX}-success`]: colors.success,
		[`${CSS_VAR_PREFIX}-warning`]: colors.warning,
		[`${CSS_VAR_PREFIX}-input`]: colors.input,
		[`${CSS_VAR_PREFIX}-ring`]: colors.ring,
	};
}

/**
 * Apply theme to document
 */
export function applyThemeToDocument(
	variant: ThemeVariant,
	effectiveMode: EffectiveMode,
	primaryOverride?: { light: HSLValue; dark: HSLValue },
	a11ySettings?: A11ySettings
): void {
	if (!isBrowser()) return;

	const root = document.documentElement;
	let colors = getThemeColors(variant, effectiveMode, primaryOverride);

	// Apply A11y transformations if provided
	if (a11ySettings) {
		colors = applyA11yTransformations(colors, effectiveMode, a11ySettings);
		applyA11yAttributes(a11ySettings);
	}

	const cssVars = colorsToCssVars(colors);

	// Set CSS variables
	Object.entries(cssVars).forEach(([key, value]) => {
		root.style.setProperty(key, value);
	});

	// Set data-theme attribute
	root.setAttribute('data-theme', variant);

	// Set dark class
	if (effectiveMode === 'dark') {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}

	// Update color-scheme for native elements
	root.style.colorScheme = effectiveMode;
}

/**
 * Load theme from localStorage
 */
export function loadThemeFromStorage(
	storageKey: string
): { mode?: string; variant?: string } | null {
	if (!isBrowser()) return null;

	try {
		const stored = localStorage.getItem(storageKey);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (e) {
		console.warn('Failed to load theme from storage:', e);
	}

	return null;
}

/**
 * Save theme to localStorage
 */
export function saveThemeToStorage(storageKey: string, mode: string, variant: string): void {
	if (!isBrowser()) return;

	try {
		localStorage.setItem(storageKey, JSON.stringify({ mode, variant }));
	} catch (e) {
		console.warn('Failed to save theme to storage:', e);
	}
}

/**
 * Parse HSL string to components
 * Input: "47 95% 58%" -> { h: 47, s: 95, l: 58 }
 */
export function parseHSL(hsl: HSLValue): { h: number; s: number; l: number } {
	const parts = hsl.split(' ');
	return {
		h: parseFloat(parts[0]),
		s: parseFloat(parts[1]),
		l: parseFloat(parts[2]),
	};
}

/**
 * Create HSL string from components
 */
export function createHSL(h: number, s: number, l: number): HSLValue {
	return `${h} ${s}% ${l}%`;
}

/**
 * Adjust lightness of an HSL color
 */
export function adjustLightness(hsl: HSLValue, amount: number): HSLValue {
	const { h, s, l } = parseHSL(hsl);
	const newL = Math.max(0, Math.min(100, l + amount));
	return createHSL(h, s, newL);
}

/**
 * Adjust saturation of an HSL color
 */
export function adjustSaturation(hsl: HSLValue, amount: number): HSLValue {
	const { h, s, l } = parseHSL(hsl);
	const newS = Math.max(0, Math.min(100, s + amount));
	return createHSL(h, newS, l);
}

/**
 * Get contrasting text color (black or white) for a background
 */
export function getContrastColor(backgroundHSL: HSLValue): HSLValue {
	const { l } = parseHSL(backgroundHSL);
	// Use white text for dark backgrounds, black for light
	return l > 55 ? '0 0% 0%' : '0 0% 100%';
}

/**
 * Generate CSS string for all theme variants
 * Useful for generating static CSS files
 */
export function generateThemeCSS(
	primaryOverrides?: Record<string, { light: HSLValue; dark: HSLValue }>
): string {
	let css = '';

	// Root (default Lume light)
	const defaultColors = getThemeColors('lume', 'light', primaryOverrides?.['lume']);
	const defaultVars = colorsToCssVars(defaultColors);
	css += ':root {\n';
	Object.entries(defaultVars).forEach(([key, value]) => {
		css += `  ${key}: ${value};\n`;
	});
	css += '}\n\n';

	// Each variant
	for (const [variantName, definition] of Object.entries(THEME_DEFINITIONS)) {
		const variant = variantName as ThemeVariant;
		const override = primaryOverrides?.[variant];

		// Light mode
		const lightColors = getThemeColors(variant, 'light', override);
		const lightVars = colorsToCssVars(lightColors);
		css += `[data-theme="${variant}"] {\n`;
		Object.entries(lightVars).forEach(([key, value]) => {
			css += `  ${key}: ${value};\n`;
		});
		css += '}\n\n';

		// Dark mode
		const darkColors = getThemeColors(variant, 'dark', override);
		const darkVars = colorsToCssVars(darkColors);
		css += `[data-theme="${variant}"].dark,\n.dark[data-theme="${variant}"] {\n`;
		Object.entries(darkVars).forEach(([key, value]) => {
			css += `  ${key}: ${value};\n`;
		});
		css += '}\n\n';
	}

	return css;
}
