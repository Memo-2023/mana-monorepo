/**
 * InputBar Settings Store
 *
 * Persisted settings for InputBar behavior and appearance.
 * Stored in localStorage for cross-session retention.
 */

const STORAGE_KEY = 'inputbar-settings';

export interface InputBarSettings {
	/** Enable syntax highlighting for #tags, @refs, dates, etc. */
	syntaxHighlighting: boolean;
	/** Auto-focus InputBar on page load */
	autoFocus: boolean;
}

const DEFAULT_SETTINGS: InputBarSettings = {
	syntaxHighlighting: true,
	autoFocus: true,
};

/**
 * Load settings from localStorage
 */
export function loadInputBarSettings(): InputBarSettings {
	if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...DEFAULT_SETTINGS, ...parsed };
		}
	} catch {
		// Ignore parse errors
	}

	return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to localStorage
 */
export function saveInputBarSettings(settings: InputBarSettings): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Ignore storage errors
	}
}

/**
 * Update a single setting
 */
export function updateInputBarSetting<K extends keyof InputBarSettings>(
	key: K,
	value: InputBarSettings[K]
): InputBarSettings {
	const current = loadInputBarSettings();
	const updated = { ...current, [key]: value };
	saveInputBarSettings(updated);
	return updated;
}

/**
 * Reset settings to defaults
 */
export function resetInputBarSettings(): InputBarSettings {
	saveInputBarSettings(DEFAULT_SETTINGS);
	return { ...DEFAULT_SETTINGS };
}

/**
 * Create a reactive Svelte 5 store for InputBar settings
 */
export function createInputBarSettingsStore() {
	let settings = $state<InputBarSettings>(loadInputBarSettings());

	function refresh() {
		settings = loadInputBarSettings();
	}

	function set<K extends keyof InputBarSettings>(key: K, value: InputBarSettings[K]) {
		settings = updateInputBarSetting(key, value);
	}

	function toggle(key: keyof InputBarSettings) {
		if (typeof settings[key] === 'boolean') {
			set(key, !settings[key] as InputBarSettings[typeof key]);
		}
	}

	function reset() {
		settings = resetInputBarSettings();
	}

	return {
		get settings() {
			return settings;
		},
		get syntaxHighlighting() {
			return settings.syntaxHighlighting;
		},
		get autoFocus() {
			return settings.autoFocus;
		},
		set,
		toggle,
		reset,
		refresh,
	};
}

// Global singleton store instance
let globalStore: ReturnType<typeof createInputBarSettingsStore> | null = null;

/**
 * Get the global InputBar settings store instance
 */
export function getInputBarSettingsStore() {
	if (!globalStore) {
		globalStore = createInputBarSettingsStore();
	}
	return globalStore;
}
