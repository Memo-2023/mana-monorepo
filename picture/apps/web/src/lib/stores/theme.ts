import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { themes, type ThemeVariant } from '@picture/design-tokens';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
	variant: ThemeVariant;
	mode: ThemeMode;
}

const THEME_VARIANT_KEY = 'picture_theme_variant';
const THEME_MODE_KEY = 'picture_theme_mode';

// Load initial values from localStorage
function loadInitialTheme(): ThemeState {
	if (!browser) {
		return { variant: 'default', mode: 'system' };
	}

	const savedVariant = localStorage.getItem(THEME_VARIANT_KEY) as ThemeVariant | null;
	const savedMode = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;

	return {
		variant: savedVariant || 'default',
		mode: savedMode || 'system'
	};
}

// Create stores with initial values
const initialTheme = loadInitialTheme();
export const themeVariant = writable<ThemeVariant>(initialTheme.variant);
export const themeMode = writable<ThemeMode>(initialTheme.mode);

// Derive the actual mode (resolve 'system' to 'light' or 'dark')
export const actualMode = derived(themeMode, ($mode) => {
	if ($mode === 'system' && browser) {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	return $mode === 'system' ? 'dark' : $mode;
});

// Derive the current theme object
export const currentTheme = derived(
	[themeVariant, actualMode],
	([$variant, $actualMode]) => {
		const theme = themes[$variant];
		return theme.colors[$actualMode];
	}
);

// Actions
export function setThemeVariant(variant: ThemeVariant) {
	themeVariant.set(variant);
	if (browser) {
		localStorage.setItem(THEME_VARIANT_KEY, variant);
	}
}

export function setThemeMode(mode: ThemeMode) {
	themeMode.set(mode);
	if (browser) {
		localStorage.setItem(THEME_MODE_KEY, mode);
	}
}

export function toggleThemeMode() {
	themeMode.update((current) => {
		const newMode = current === 'dark' ? 'light' : 'dark';
		if (browser) {
			localStorage.setItem(THEME_MODE_KEY, newMode);
		}
		return newMode;
	});
}

// Listen to system theme changes and apply theme to DOM
if (browser) {
	// Listen to system color scheme changes
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', () => {
		// Force re-evaluation of actualMode when system preference changes
		themeMode.update((mode) => mode);
	});

	// Apply CSS custom properties and background colors
	currentTheme.subscribe((theme) => {
		const root = document.documentElement;

		// Primary colors
		root.style.setProperty('--color-primary', theme.primary.default);
		root.style.setProperty('--color-primary-hover', theme.primary.hover);
		root.style.setProperty('--color-primary-active', theme.primary.active);

		// Background colors
		root.style.setProperty('--color-background', theme.background);
		root.style.setProperty('--color-surface', theme.surface);
		root.style.setProperty('--color-elevated', theme.elevated);

		// Text colors
		root.style.setProperty('--color-text-primary', theme.text.primary);
		root.style.setProperty('--color-text-secondary', theme.text.secondary);
		root.style.setProperty('--color-text-tertiary', theme.text.tertiary);

		// Border colors
		root.style.setProperty('--color-border', theme.border);
		root.style.setProperty('--color-divider', theme.divider);

		// Status colors
		root.style.setProperty('--color-success', theme.success);
		root.style.setProperty('--color-error', theme.error);
		root.style.setProperty('--color-warning', theme.warning);
		root.style.setProperty('--color-info', theme.info);

		// Apply background color to body
		document.body.style.backgroundColor = theme.background;
		document.body.style.color = theme.text.primary;
	});

	// Apply dark/light mode class to document element
	actualMode.subscribe((mode) => {
		document.documentElement.classList.remove('light', 'dark');
		document.documentElement.classList.add(mode);
	});
}
