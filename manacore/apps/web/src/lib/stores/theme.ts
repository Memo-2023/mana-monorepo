import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
	mode: ThemeMode;
	effectiveMode: 'light' | 'dark';
}

function createThemeStore() {
	const getInitialMode = (): ThemeMode => {
		if (browser) {
			const stored = localStorage.getItem('theme-mode');
			if (stored === 'light' || stored === 'dark' || stored === 'system') {
				return stored;
			}
		}
		return 'system';
	};

	const getSystemPreference = (): 'light' | 'dark' => {
		if (browser && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}
		return 'light';
	};

	const mode = writable<ThemeMode>(getInitialMode());

	const effectiveMode = derived(mode, ($mode) => {
		if ($mode === 'system') {
			return getSystemPreference();
		}
		return $mode;
	});

	const state = derived([mode, effectiveMode], ([$mode, $effectiveMode]) => ({
		mode: $mode,
		effectiveMode: $effectiveMode
	}));

	// Apply theme to document
	if (browser) {
		effectiveMode.subscribe((effective) => {
			if (effective === 'dark') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		});

		// Listen for system preference changes
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
			mode.update((m) => m); // Trigger re-evaluation
		});
	}

	return {
		subscribe: state.subscribe,
		setMode: (newMode: ThemeMode) => {
			mode.set(newMode);
			if (browser) {
				localStorage.setItem('theme-mode', newMode);
			}
		},
		toggleMode: () => {
			mode.update((current) => {
				const newMode = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
				if (browser) {
					localStorage.setItem('theme-mode', newMode);
				}
				return newMode;
			});
		}
	};
}

export const theme = createThemeStore();
