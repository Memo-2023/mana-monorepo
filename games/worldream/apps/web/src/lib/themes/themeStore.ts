import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { themes, generateCssVariables, getTheme } from './themes.config';

export type ThemeName = keyof typeof themes;
export type ThemeMode = 'light' | 'dark';

export interface ThemeState {
	theme: ThemeName;
	mode: ThemeMode;
}

function createThemeStore() {
	const { subscribe, set, update } = writable<ThemeState>({ theme: 'default', mode: 'light' });

	function applyTheme(state: ThemeState) {
		if (!browser) return;

		const theme = getTheme(state.theme);
		if (!theme) return;

		// Set data attributes
		document.documentElement.setAttribute('data-theme', state.theme);
		document.documentElement.setAttribute('data-mode', state.mode);

		// Apply CSS variables dynamically
		const cssVariables = generateCssVariables(theme, state.mode === 'dark');
		const root = document.documentElement;

		Object.entries(cssVariables).forEach(([key, value]) => {
			root.style.setProperty(key, value);
		});

		// Update dark mode class for Tailwind compatibility
		if (state.mode === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}

		// Store preferences
		localStorage.setItem('selectedTheme', state.theme);
		localStorage.setItem('selectedMode', state.mode);
	}

	return {
		subscribe,
		init: () => {
			if (!browser) return;

			// Check for saved preferences
			const savedTheme = localStorage.getItem('selectedTheme') as ThemeName | null;
			const savedMode = localStorage.getItem('selectedMode') as ThemeMode | null;

			// Check system preference as fallback
			const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

			// Determine initial state
			const initialState: ThemeState = {
				theme: savedTheme && themes[savedTheme] ? savedTheme : 'default',
				mode: savedMode || (systemPrefersDark ? 'dark' : 'light'),
			};

			// Apply the initial theme
			set(initialState);
			applyTheme(initialState);
		},
		setTheme: (themeName: ThemeName) => {
			if (!themes[themeName]) {
				console.warn(`Theme "${themeName}" not found`);
				return;
			}
			update((current) => {
				const newState = { ...current, theme: themeName };
				applyTheme(newState);
				return newState;
			});
		},
		setMode: (mode: ThemeMode) => {
			update((current) => {
				const newState = { ...current, mode };
				applyTheme(newState);
				return newState;
			});
		},
		toggleMode: () => {
			update((current) => {
				const newMode: ThemeMode = current.mode === 'light' ? 'dark' : 'light';
				const newState: ThemeState = { ...current, mode: newMode };
				applyTheme(newState);
				return newState;
			});
		},
		cycleTheme: () => {
			update((current) => {
				// Cycle through all available themes
				const themeNames = Object.keys(themes) as ThemeName[];
				const currentIndex = themeNames.indexOf(current.theme);
				const nextIndex = (currentIndex + 1) % themeNames.length;
				const newTheme = themeNames[nextIndex];
				const newState = { ...current, theme: newTheme };
				applyTheme(newState);
				return newState;
			});
		},
		getAvailableThemes: () => {
			return Object.entries(themes).map(([key, theme]) => ({
				id: key as ThemeName,
				name: theme.name,
			}));
		},
		getCurrentTheme: () => {
			let currentState: ThemeState;
			subscribe((state) => (currentState = state))();
			return currentState!;
		},
	};
}

export const theme = createThemeStore();
