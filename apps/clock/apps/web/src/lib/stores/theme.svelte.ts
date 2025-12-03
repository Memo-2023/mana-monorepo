/**
 * Theme store for Clock app
 * Manages light/dark mode and theme variants
 * SSR-safe implementation
 */

import { browser } from '$app/environment';
import {
	THEME_VARIANTS,
	type ThemeVariant,
	type ThemeMode,
	THEME_DEFINITIONS,
} from '@manacore/shared-theme';

// Storage keys
const MODE_KEY = 'clock-theme-mode';
const VARIANT_KEY = 'clock-theme-variant';

// Default values for SSR
const DEFAULT_MODE: ThemeMode = 'system';
const DEFAULT_VARIANT: ThemeVariant = 'lume';

// State (only used client-side, but initialized for SSR)
let mode = $state<ThemeMode>(DEFAULT_MODE);
let variant = $state<ThemeVariant>(DEFAULT_VARIANT);
let isDark = $state(false);
let initialized = $state(false);

// Get system preference
function getSystemPrefersDark(): boolean {
	if (!browser) return false;
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Apply theme to document
function applyTheme() {
	if (!browser) return;

	// Determine if dark mode
	const currentMode = mode ?? DEFAULT_MODE;
	const shouldBeDark = currentMode === 'system' ? getSystemPrefersDark() : currentMode === 'dark';
	isDark = shouldBeDark;

	// Apply to document
	const currentVariant = variant ?? DEFAULT_VARIANT;
	document.documentElement.classList.toggle('dark', shouldBeDark);
	document.documentElement.setAttribute('data-theme', currentVariant);
}

// Listen for system preference changes (only in browser)
if (browser) {
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		if ((mode ?? DEFAULT_MODE) === 'system') {
			applyTheme();
		}
	});
}

export const theme = {
	// Getters (SSR-safe with fallbacks)
	get mode(): ThemeMode {
		return mode ?? DEFAULT_MODE;
	},
	get variant(): ThemeVariant {
		return variant ?? DEFAULT_VARIANT;
	},
	get isDark(): boolean {
		return isDark ?? false;
	},
	get variants(): readonly ThemeVariant[] {
		return THEME_VARIANTS;
	},
	get initialized(): boolean {
		return initialized;
	},

	/**
	 * Initialize theme from localStorage (client-side only)
	 */
	initialize() {
		if (!browser) return;
		if (initialized) return;

		// Load saved preferences
		const savedMode = localStorage.getItem(MODE_KEY) as ThemeMode | null;
		const savedVariant = localStorage.getItem(VARIANT_KEY) as ThemeVariant | null;

		if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
			mode = savedMode;
		}

		if (savedVariant && THEME_VARIANTS.includes(savedVariant)) {
			variant = savedVariant;
		}

		initialized = true;
		applyTheme();
	},

	/**
	 * Set theme mode
	 */
	setMode(newMode: ThemeMode) {
		mode = newMode;
		if (browser) {
			localStorage.setItem(MODE_KEY, newMode);
		}
		applyTheme();
	},

	/**
	 * Toggle between light and dark
	 */
	toggleMode() {
		const currentDark = isDark ?? false;
		const newMode = currentDark ? 'light' : 'dark';
		this.setMode(newMode);
	},

	/**
	 * Set theme variant
	 */
	setVariant(newVariant: ThemeVariant) {
		if (!THEME_VARIANTS.includes(newVariant)) return;
		variant = newVariant;
		if (browser) {
			localStorage.setItem(VARIANT_KEY, newVariant);
		}
		applyTheme();
	},
};
