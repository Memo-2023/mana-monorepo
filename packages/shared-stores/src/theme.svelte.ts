/**
 * Theme Store Factory
 * Creates a theme state store with Svelte 5 runes.
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeStore {
	readonly isDark: boolean;
	readonly mode: ThemeMode;
	readonly variant: string;
	initialize: () => () => void;
	setMode: (mode: ThemeMode) => void;
	setVariant: (variant: string) => void;
	toggle: () => void;
}

export interface ThemeStoreConfig {
	/** Storage key prefix (default: 'theme') */
	storagePrefix?: string;
	/** Default theme mode */
	defaultMode?: ThemeMode;
	/** Default theme variant */
	defaultVariant?: string;
	/** CSS class to add/remove for dark mode */
	darkClass?: string;
	/** Data attribute for variant */
	variantAttribute?: string;
}

/**
 * Create a theme store with Svelte 5 runes.
 */
export function createThemeStore(config: ThemeStoreConfig = {}): ThemeStore {
	const {
		storagePrefix = 'theme',
		defaultMode = 'system',
		defaultVariant = 'default',
		darkClass = 'dark',
		variantAttribute = 'data-theme',
	} = config;

	let isDark = $state(false);
	let mode = $state<ThemeMode>(defaultMode);
	let variant = $state(defaultVariant);

	function updateTheme() {
		if (typeof window === 'undefined') return;

		let shouldBeDark = false;
		if (mode === 'dark') {
			shouldBeDark = true;
		} else if (mode === 'system') {
			shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}

		isDark = shouldBeDark;
		document.documentElement.classList.toggle(darkClass, isDark);
	}

	function initialize(): () => void {
		if (typeof window === 'undefined') return () => {};

		// Load from localStorage
		const savedMode = localStorage.getItem(`${storagePrefix}-mode`) as ThemeMode | null;
		const savedVariant = localStorage.getItem(`${storagePrefix}-variant`);

		if (savedMode) mode = savedMode;
		if (savedVariant) {
			variant = savedVariant;
			document.documentElement.setAttribute(variantAttribute, variant);
		}

		updateTheme();

		// Listen for system theme changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = () => {
			if (mode === 'system') {
				updateTheme();
			}
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}

	function setMode(newMode: ThemeMode) {
		mode = newMode;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(`${storagePrefix}-mode`, newMode);
		}
		updateTheme();
	}

	function setVariant(newVariant: string) {
		variant = newVariant;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(`${storagePrefix}-variant`, newVariant);
		}
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute(variantAttribute, newVariant);
		}
	}

	function toggle() {
		setMode(isDark ? 'light' : 'dark');
	}

	return {
		get isDark() {
			return isDark;
		},
		get mode() {
			return mode;
		},
		get variant() {
			return variant;
		},
		initialize,
		setMode,
		setVariant,
		toggle,
	};
}
