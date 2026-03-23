/**
 * Theme Store - Manages theme state using Svelte 5 runes
 */

import { browser } from '$app/environment';
import type { ThemeMode, ThemeVariant } from '@manacore/shared-theme';

let mode = $state<ThemeMode>('system');
let variant = $state<ThemeVariant>('lume');
let initialized = $state(false);

let isDark = $derived(
	mode === 'system'
		? browser
			? window.matchMedia('(prefers-color-scheme: dark)').matches
			: true
		: mode === 'dark'
);

function applyTheme() {
	if (!browser) return;

	const root = document.documentElement;

	if (isDark) {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}

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

		const savedMode = localStorage.getItem('citycorners-theme-mode') as ThemeMode | null;
		const savedVariant = localStorage.getItem('citycorners-theme-variant') as ThemeVariant | null;

		if (savedMode) mode = savedMode;
		if (savedVariant) variant = savedVariant;

		applyTheme();

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
			localStorage.setItem('citycorners-theme-mode', newMode);
			applyTheme();
		}
	},

	setVariant(newVariant: ThemeVariant) {
		variant = newVariant;
		if (browser) {
			localStorage.setItem('citycorners-theme-variant', newVariant);
			applyTheme();
		}
	},

	toggleMode() {
		const newMode = isDark ? 'light' : 'dark';
		this.setMode(newMode);
	},
};
