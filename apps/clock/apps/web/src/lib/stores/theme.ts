/**
 * Theme store for Clock app
 * Manages light/dark mode and theme variants
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

// State
let mode = $state<ThemeMode>('system');
let variant = $state<ThemeVariant>('amber');
let isDark = $state(false);

// Get system preference
function getSystemPrefersDark(): boolean {
	if (!browser) return false;
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Apply theme to document
function applyTheme() {
	if (!browser) return;

	// Determine if dark mode
	const shouldBeDark = mode === 'system' ? getSystemPrefersDark() : mode === 'dark';
	isDark = shouldBeDark;

	// Apply to document
	document.documentElement.classList.toggle('dark', shouldBeDark);
	document.documentElement.setAttribute('data-theme', variant);
}

// Listen for system preference changes
if (browser) {
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		if (mode === 'system') {
			applyTheme();
		}
	});
}

export const theme = {
	// Getters
	get mode() {
		return mode;
	},
	get variant() {
		return variant;
	},
	get isDark() {
		return isDark;
	},
	get variants() {
		return THEME_VARIANTS;
	},

	/**
	 * Initialize theme from localStorage
	 */
	initialize() {
		if (!browser) return;

		// Load saved preferences
		const savedMode = localStorage.getItem(MODE_KEY) as ThemeMode | null;
		const savedVariant = localStorage.getItem(VARIANT_KEY) as ThemeVariant | null;

		if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
			mode = savedMode;
		}

		if (savedVariant && THEME_VARIANTS.includes(savedVariant)) {
			variant = savedVariant;
		}

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
		const newMode = isDark ? 'light' : 'dark';
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
