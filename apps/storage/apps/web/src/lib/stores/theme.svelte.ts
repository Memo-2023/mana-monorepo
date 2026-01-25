/**
 * Theme Store - Manages theme state
 */

import { browser } from '$app/environment';
import {
	THEME_DEFINITIONS,
	THEME_VARIANTS,
	type ThemeMode,
	type ThemeVariant,
	DEFAULT_VARIANT,
} from '@manacore/shared-theme';

const STORAGE_KEY_MODE = 'storage-theme-mode';
const STORAGE_KEY_VARIANT = 'storage-theme-variant';

function createThemeStore() {
	let mode = $state<ThemeMode>('system');
	let variant = $state<ThemeVariant>(DEFAULT_VARIANT);
	let systemPrefersDark = $state(false);

	function getSystemPreference(): boolean {
		if (!browser) return false;
		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	}

	function applyTheme() {
		if (!browser) return;

		const isDarkMode = mode === 'dark' || (mode === 'system' && systemPrefersDark);
		const themeClass = isDarkMode
			? THEME_DEFINITIONS[variant].darkClass
			: THEME_DEFINITIONS[variant].lightClass;

		document.documentElement.className = themeClass;
	}

	return {
		get mode() {
			return mode;
		},
		get variant() {
			return variant;
		},
		get isDark() {
			return mode === 'dark' || (mode === 'system' && systemPrefersDark);
		},
		get variants() {
			return THEME_VARIANTS;
		},

		initialize() {
			if (!browser) return;

			const savedMode = localStorage.getItem(STORAGE_KEY_MODE) as ThemeMode | null;
			const savedVariant = localStorage.getItem(STORAGE_KEY_VARIANT) as ThemeVariant | null;

			if (savedMode) mode = savedMode;
			if (savedVariant && savedVariant in THEME_DEFINITIONS) variant = savedVariant;

			systemPrefersDark = getSystemPreference();

			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			mediaQuery.addEventListener('change', (e) => {
				systemPrefersDark = e.matches;
				applyTheme();
			});

			applyTheme();
		},

		setMode(newMode: ThemeMode) {
			mode = newMode;
			if (browser) {
				localStorage.setItem(STORAGE_KEY_MODE, newMode);
			}
			applyTheme();
		},

		setVariant(newVariant: ThemeVariant) {
			variant = newVariant;
			if (browser) {
				localStorage.setItem(STORAGE_KEY_VARIANT, newVariant);
			}
			applyTheme();
		},

		toggleMode() {
			const newMode = mode === 'dark' ? 'light' : 'dark';
			this.setMode(newMode);
		},
	};
}

export const theme = createThemeStore();
