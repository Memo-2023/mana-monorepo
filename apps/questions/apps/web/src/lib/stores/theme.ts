import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

function getInitialTheme(): Theme {
	if (!browser) return 'system';

	const stored = localStorage.getItem('theme') as Theme | null;
	if (stored && ['light', 'dark', 'system'].includes(stored)) {
		return stored;
	}
	return 'system';
}

function applyTheme(theme: Theme) {
	if (!browser) return;

	const root = document.documentElement;
	const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	const isDark = theme === 'dark' || (theme === 'system' && systemDark);

	if (isDark) {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}
}

let currentTheme: Theme = 'system';

export const theme = {
	get current() {
		return currentTheme;
	},

	initialize() {
		currentTheme = getInitialTheme();
		applyTheme(currentTheme);

		if (browser) {
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
				if (currentTheme === 'system') {
					applyTheme('system');
				}
			});
		}
	},

	set(newTheme: Theme) {
		currentTheme = newTheme;
		if (browser) {
			localStorage.setItem('theme', newTheme);
		}
		applyTheme(newTheme);
	},

	toggle() {
		const next = currentTheme === 'light' ? 'dark' : 'light';
		this.set(next);
	},
};
