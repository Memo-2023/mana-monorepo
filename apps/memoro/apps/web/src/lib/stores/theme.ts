import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeVariant = 'lume' | 'nature' | 'ocean' | 'stone';

interface ThemeState {
	mode: ThemeMode;
	variant: ThemeVariant;
	// The actual rendered mode (light or dark), derived from mode and system preference
	effectiveMode: 'light' | 'dark';
}

const THEME_STORAGE_KEY = 'memoro-theme';

// Get initial theme from localStorage or system preference
function getInitialTheme(): ThemeState {
	if (!browser) {
		return { mode: 'system', variant: 'lume', effectiveMode: 'light' };
	}

	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	let mode: ThemeMode = 'system';
	let variant: ThemeVariant = 'lume';

	if (stored) {
		try {
			const parsed = JSON.parse(stored);
			mode = parsed.mode || 'system';
			variant = parsed.variant || 'lume';
		} catch {
			// Fall through to default
		}
	}

	// Calculate effective mode
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	const effectiveMode: 'light' | 'dark' =
		mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode === 'dark' ? 'dark' : 'light';

	return {
		mode,
		variant,
		effectiveMode,
	};
}

// Create the theme store
function createThemeStore() {
	const { subscribe, set, update } = writable<ThemeState>(getInitialTheme());

	return {
		subscribe,
		setMode: (mode: ThemeMode) => {
			update((state) => {
				const prefersDark = browser
					? window.matchMedia('(prefers-color-scheme: dark)').matches
					: false;
				const effectiveMode: 'light' | 'dark' =
					mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode === 'dark' ? 'dark' : 'light';

				const newState = { ...state, mode, effectiveMode };
				if (browser) {
					localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newState));
					applyTheme(newState);
				}
				return newState;
			});
		},
		setVariant: (variant: ThemeVariant) => {
			update((state) => {
				const newState = { ...state, variant };
				if (browser) {
					localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newState));
					applyTheme(newState);
				}
				return newState;
			});
		},
		toggleMode: () => {
			update((state) => {
				// Toggle between light and dark (skip system)
				const newMode: ThemeMode = state.effectiveMode === 'light' ? 'dark' : 'light';
				const newState = { ...state, mode: newMode, effectiveMode: newMode };
				if (browser) {
					localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newState));
					applyTheme(newState);
				}
				return newState;
			});
		},
		initialize: () => {
			if (browser) {
				const state = getInitialTheme();
				set(state);
				applyTheme(state);

				// Listen for system theme changes
				const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
				const handleChange = (e: MediaQueryListEvent) => {
					// Only update if mode is set to 'system'
					update((state) => {
						if (state.mode === 'system') {
							const newEffectiveMode: 'light' | 'dark' = e.matches ? 'dark' : 'light';
							const newState = { ...state, effectiveMode: newEffectiveMode };
							applyTheme(newState);
							return newState;
						}
						return state;
					});
				};
				mediaQuery.addEventListener('change', handleChange);

				// Cleanup function
				return () => mediaQuery.removeEventListener('change', handleChange);
			}
		},
	};
}

// Apply theme to document
function applyTheme(state: ThemeState) {
	if (!browser) return;

	const html = document.documentElement;

	// Apply dark mode class based on effectiveMode
	if (state.effectiveMode === 'dark') {
		html.classList.add('dark');
	} else {
		html.classList.remove('dark');
	}

	// Apply theme variant as data attribute
	html.setAttribute('data-theme', state.variant);
}

export const theme = createThemeStore();
