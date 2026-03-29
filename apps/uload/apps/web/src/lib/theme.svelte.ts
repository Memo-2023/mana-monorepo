export type ThemeMode = 'light' | 'dark' | 'system';

class ThemeStore {
	mode = $state<ThemeMode>('system');

	initialize() {
		if (typeof window === 'undefined') return;
		const saved = localStorage.getItem('uload-theme') as ThemeMode | null;
		if (saved) this.mode = saved;
		this.apply();
	}

	setMode(mode: ThemeMode) {
		this.mode = mode;
		localStorage?.setItem('uload-theme', mode);
		this.apply();
	}

	private apply() {
		if (typeof document === 'undefined') return;
		const isDark =
			this.mode === 'dark' ||
			(this.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
		document.documentElement.classList.toggle('dark', isDark);
	}
}

export const themeStore = new ThemeStore();
