import { browser } from '$app/environment';
import { themes, defaultTheme, type ThemePreset } from './presets';
import { writable, derived, get } from 'svelte/store';

export type ThemeMode = 'light' | 'dark' | 'system';

class ThemeStore {
	// Using Svelte stores instead of runes for SSR compatibility
	private presetStore = writable<string>(defaultTheme);
	private modeStore = writable<ThemeMode>('system');
	private systemPrefersDarkStore = writable(false);
	private transitioningStore = writable(false);

	// Public readable stores
	public preset = { subscribe: this.presetStore.subscribe };
	public mode = { subscribe: this.modeStore.subscribe };
	public transitioning = { subscribe: this.transitioningStore.subscribe };

	// Derived stores
	public currentPreset = derived(this.presetStore, ($preset) => themes[$preset] || themes[defaultTheme]);

	public isDark = derived(
		[this.modeStore, this.systemPrefersDarkStore],
		([$mode, $systemPrefersDark]) => {
			return $mode === 'system' ? $systemPrefersDark : $mode === 'dark';
		}
	);

	public colors = derived([this.currentPreset, this.isDark], ([$currentPreset, $isDark]) => {
		return $isDark ? $currentPreset.colors.dark : $currentPreset.colors.light;
	});

	public font = derived(this.currentPreset, ($currentPreset) => $currentPreset.font);

	constructor() {
		if (browser) {
			this.init();
		}
	}

	private init() {
		// Load saved preferences
		const savedPreset = localStorage.getItem('theme-preset');
		const savedMode = localStorage.getItem('theme-mode') as ThemeMode;

		if (savedPreset && themes[savedPreset]) {
			this.presetStore.set(savedPreset);
		}

		if (savedMode) {
			this.modeStore.set(savedMode);
		}

		// Detect system preference
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		this.systemPrefersDarkStore.set(mediaQuery.matches);

		mediaQuery.addEventListener('change', (e) => {
			this.systemPrefersDarkStore.set(e.matches);
			if (get(this.modeStore) === 'system') {
				this.applyTheme();
			}
		});

		// Apply initial theme
		this.applyTheme();

		// Subscribe to changes
		this.presetStore.subscribe(() => this.applyTheme());
		this.modeStore.subscribe(() => this.applyTheme());
		this.isDark.subscribe(() => this.applyTheme());
	}

	// Apply theme to DOM
	applyTheme() {
		if (!browser) return;

		const root = document.documentElement;
		const colors = get(this.colors);
		const font = get(this.font);
		const isDark = get(this.isDark);

		// Apply dark class
		if (isDark) {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}

		// Apply CSS variables
		Object.entries(colors).forEach(([key, value]) => {
			// Convert camelCase to kebab-case for CSS variables
			const cssKey = key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
			const varName = `--theme-${cssKey}`;
			root.style.setProperty(varName, value);
		});

		// Apply font
		root.style.setProperty('--theme-font-family', font.family);

		// Load Google Font if needed
		if (font.import) {
			const preset = get(this.presetStore);
			const fontId = `theme-font-${preset}`;
			let existingFont = document.getElementById(fontId);

			// Remove old font links
			document.querySelectorAll('link[id^="theme-font-"]').forEach((link) => {
				if (link.id !== fontId) {
					link.remove();
				}
			});

			// Add new font link if not exists
			if (!existingFont) {
				const link = document.createElement('link');
				link.id = fontId;
				link.rel = 'stylesheet';
				link.href = font.import;
				document.head.appendChild(link);
			}
		}

		// Save to localStorage
		localStorage.setItem('theme-preset', get(this.presetStore));
		localStorage.setItem('theme-mode', get(this.modeStore));
	}

	// Change theme preset with transition
	async setPreset(presetId: string) {
		if (!themes[presetId]) return;

		if (browser) {
			this.transitioningStore.set(true);
			document.documentElement.classList.add('theme-transitioning');

			// Small delay for transition start
			await new Promise((resolve) => setTimeout(resolve, 50));

			this.presetStore.set(presetId);

			// Wait for transition to complete
			await new Promise((resolve) => setTimeout(resolve, 300));

			document.documentElement.classList.remove('theme-transitioning');
			this.transitioningStore.set(false);
		} else {
			this.presetStore.set(presetId);
		}
	}

	// Change theme mode
	setMode(mode: ThemeMode) {
		this.modeStore.set(mode);
	}

	// Toggle between light and dark
	toggle() {
		const currentMode = get(this.modeStore);
		const systemPrefersDark = get(this.systemPrefersDarkStore);

		if (currentMode === 'system') {
			// If system mode, switch to opposite of current system preference
			this.modeStore.set(systemPrefersDark ? 'light' : 'dark');
		} else {
			// Toggle between light and dark
			this.modeStore.set(currentMode === 'light' ? 'dark' : 'light');
		}
	}

	// Get all available themes
	get availableThemes() {
		return Object.values(themes);
	}
}

export const themeStore = new ThemeStore();