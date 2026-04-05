import type { A11yStore, A11yStoreConfig, ContrastLevel, ColorblindMode } from './types';
import { DEFAULT_A11Y_SETTINGS, A11Y_STORAGE_KEY_SUFFIX } from './a11y-constants';
import {
	getSystemReducedMotion,
	createReducedMotionListener,
	applyA11yAttributes,
	loadA11yFromStorage,
	saveA11yToStorage,
} from './a11y-utils';
import { isBrowser } from './utils';

/**
 * Create an A11y store for your app
 *
 * @example
 * ```typescript
 * import { createA11yStore } from '@mana/shared-theme';
 *
 * export const a11y = createA11yStore({ appId: 'myapp' });
 *
 * // In +layout.svelte
 * onMount(() => {
 *   const cleanup = a11y.initialize();
 *   return cleanup;
 * });
 * ```
 */
export function createA11yStore(config: A11yStoreConfig): A11yStore {
	const { appId, defaults = {} } = config;
	const storageKey = `${appId}${A11Y_STORAGE_KEY_SUFFIX}`;

	// Merge defaults
	const defaultSettings = { ...DEFAULT_A11Y_SETTINGS, ...defaults };

	// Svelte 5 runes state
	let contrast = $state<ContrastLevel>(defaultSettings.contrast);
	let colorblind = $state<ColorblindMode>(defaultSettings.colorblind);
	let userReduceMotion = $state<boolean | null>(null); // null = use system
	let systemReduceMotion = $state<boolean>(false);

	// Derived: effective reduce motion
	const reduceMotion = $derived(userReduceMotion !== null ? userReduceMotion : systemReduceMotion);

	// Derived: whether user has explicitly set reduce motion
	const reduceMotionExplicit = $derived(userReduceMotion !== null);

	/**
	 * Apply current A11y settings to document
	 */
	function applySettings(): void {
		applyA11yAttributes({
			contrast,
			colorblind,
			reduceMotion,
		});
		saveSettings();
	}

	/**
	 * Save settings to localStorage
	 */
	function saveSettings(): void {
		saveA11yToStorage(storageKey, {
			contrast,
			colorblind,
			reduceMotion: userReduceMotion !== null ? userReduceMotion : false,
		});
	}

	/**
	 * Set contrast level
	 */
	function setContrast(level: ContrastLevel): void {
		if (level === contrast) return;
		if (level !== 'normal' && level !== 'high') {
			console.warn(`Invalid contrast level: ${level}`);
			return;
		}
		contrast = level;
		applySettings();
	}

	/**
	 * Set colorblind mode
	 */
	function setColorblind(mode: ColorblindMode): void {
		if (mode === colorblind) return;
		const validModes: ColorblindMode[] = ['none', 'deuteranopia', 'protanopia', 'monochrome'];
		if (!validModes.includes(mode)) {
			console.warn(`Invalid colorblind mode: ${mode}`);
			return;
		}
		colorblind = mode;
		applySettings();
	}

	/**
	 * Set reduce motion preference
	 */
	function setReduceMotion(reduce: boolean): void {
		userReduceMotion = reduce;
		applySettings();
	}

	/**
	 * Reset reduce motion to system default
	 */
	function resetReduceMotion(): void {
		userReduceMotion = null;
		applySettings();
	}

	/**
	 * Reset all A11y settings to defaults
	 */
	function resetAll(): void {
		contrast = defaultSettings.contrast;
		colorblind = defaultSettings.colorblind;
		userReduceMotion = null;
		applySettings();
	}

	/**
	 * Initialize A11y store
	 * - Loads saved preferences from localStorage
	 * - Sets up reduced motion listener
	 * - Applies initial settings
	 *
	 * @returns Cleanup function to remove listeners
	 */
	function initialize(): () => void {
		if (!isBrowser()) {
			return () => {};
		}

		// Get system reduced motion preference
		systemReduceMotion = getSystemReducedMotion();

		// Load saved preferences
		const saved = loadA11yFromStorage(storageKey);
		if (saved) {
			if (saved.contrast && (saved.contrast === 'normal' || saved.contrast === 'high')) {
				contrast = saved.contrast;
			}
			if (saved.colorblind) {
				const validModes: ColorblindMode[] = ['none', 'deuteranopia', 'protanopia', 'monochrome'];
				if (validModes.includes(saved.colorblind as ColorblindMode)) {
					colorblind = saved.colorblind as ColorblindMode;
				}
			}
			if (typeof saved.reduceMotion === 'boolean') {
				userReduceMotion = saved.reduceMotion;
			}
		}

		// Apply initial settings
		applySettings();

		// Listen for system reduced motion changes
		const cleanup = createReducedMotionListener((reduces) => {
			systemReduceMotion = reduces;
			// Only re-apply if user hasn't explicitly set a preference
			if (userReduceMotion === null) {
				applySettings();
			}
		});

		return cleanup;
	}

	return {
		get contrast() {
			return contrast;
		},
		get colorblind() {
			return colorblind;
		},
		get reduceMotion() {
			return reduceMotion;
		},
		get reduceMotionExplicit() {
			return reduceMotionExplicit;
		},

		setContrast,
		setColorblind,
		setReduceMotion,
		resetReduceMotion,
		resetAll,
		initialize,
	};
}
