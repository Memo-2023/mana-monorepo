/**
 * Theme Store - Manages theme state using Svelte 5 runes
 */

import { browser } from '$app/environment';
import type { ThemeMode, ThemeVariant } from '@manacore/shared-theme';

// State
let mode = $state<ThemeMode>('system');
let variant = $state<ThemeVariant>('lume');
let initialized = $state(false);

// Derived state
let isDark = $derived(
	mode === 'system'
		? browser
			? window.matchMedia('(prefers-color-scheme: dark)').matches
			: true // Default to dark for SSR
		: mode === 'dark'
);

function applyTheme() {
	if (!browser) return;

	const root = document.documentElement;

	// Apply dark/light mode
	if (isDark) {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}

	// Apply variant
	root.setAttribute('data-theme', variant);
}

export const theme = {
	get mode() {
		return mode;
	},
	get variant() {
		return variant;
	},
	get isDark() {
		return isDark;
	},
	get initialized() {
		return initialized;
	},

	initialize() {
		if (!browser || initialized) return;

		// Load from localStorage
		const savedMode = localStorage.getItem('zitare-theme-mode') as ThemeMode | null;
		const savedVariant = localStorage.getItem('zitare-theme-variant') as ThemeVariant | null;

		if (savedMode) mode = savedMode;
		if (savedVariant) variant = savedVariant;

		// Apply initial theme
		applyTheme();

		// Listen for system theme changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', () => {
			if (mode === 'system') {
				applyTheme();
			}
		});

		initialized = true;
	},

	setMode(newMode: ThemeMode) {
		mode = newMode;
		if (browser) {
			localStorage.setItem('zitare-theme-mode', newMode);
			applyTheme();
		}
	},

	setVariant(newVariant: ThemeVariant) {
		variant = newVariant;
		if (browser) {
			localStorage.setItem('zitare-theme-variant', newVariant);
			applyTheme();
		}
	},

	toggleMode() {
		const newMode = isDark ? 'light' : 'dark';
		this.setMode(newMode);
	},
};
