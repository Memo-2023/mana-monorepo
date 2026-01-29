/**
 * App Settings Store Factory
 *
 * Creates a type-safe settings store with localStorage persistence.
 * Reduces ~200 LOC boilerplate per app to ~20 LOC.
 *
 * @example
 * ```typescript
 * interface MyAppSettings {
 *   theme: 'light' | 'dark';
 *   sidebarCollapsed: boolean;
 *   immersiveModeEnabled: boolean;
 * }
 *
 * const DEFAULT_SETTINGS: MyAppSettings = {
 *   theme: 'light',
 *   sidebarCollapsed: false,
 *   immersiveModeEnabled: false,
 * };
 *
 * export const settingsStore = createAppSettingsStore('my-app-settings', DEFAULT_SETTINGS);
 *
 * // Usage:
 * settingsStore.settings.theme  // 'light'
 * settingsStore.set('theme', 'dark');
 * settingsStore.update({ sidebarCollapsed: true });
 * settingsStore.toggleImmersiveMode(); // If immersiveModeEnabled exists
 * ```
 */

import { browser } from '$app/environment';

export interface AppSettingsStoreOptions<T> {
	/**
	 * Callback invoked after each settings change.
	 * Use for cloud sync or other side effects.
	 */
	onSettingsChange?: (settings: T) => void | Promise<void>;
}

export interface AppSettingsStore<T extends Record<string, unknown>> {
	/** Current settings state (reactive) */
	readonly settings: T;

	/** Get the default settings */
	getDefaults(): T;

	/** Initialize settings from localStorage (call on mount) */
	initialize(): void;

	/** Set a single setting value */
	set<K extends keyof T>(key: K, value: T[K]): void;

	/** Update multiple settings at once */
	update(updates: Partial<T>): void;

	/** Reset all settings to defaults */
	reset(): void;

	/** Toggle immersive mode (if immersiveModeEnabled exists in settings) */
	toggleImmersiveMode(): void;
}

/**
 * Creates a settings store with localStorage persistence.
 *
 * @param storageKey - localStorage key for persistence
 * @param defaultSettings - Default settings object
 * @param options - Optional configuration (onSettingsChange callback)
 * @returns AppSettingsStore instance
 */
export function createAppSettingsStore<T extends Record<string, unknown>>(
	storageKey: string,
	defaultSettings: T,
	options?: AppSettingsStoreOptions<T>
): AppSettingsStore<T> {
	// Load settings from localStorage
	function loadSettings(): T {
		if (!browser) return { ...defaultSettings };

		try {
			const stored = localStorage.getItem(storageKey);
			if (stored) {
				const parsed = JSON.parse(stored);
				// Merge with defaults to handle new settings added after initial save
				return { ...defaultSettings, ...parsed };
			}
		} catch (e) {
			console.error(`Failed to load settings from ${storageKey}:`, e);
		}

		return { ...defaultSettings };
	}

	// Save settings to localStorage
	function saveSettings(newSettings: T): void {
		if (!browser) return;

		try {
			localStorage.setItem(storageKey, JSON.stringify(newSettings));
		} catch (e) {
			console.error(`Failed to save settings to ${storageKey}:`, e);
		}

		// Invoke callback if provided
		options?.onSettingsChange?.(newSettings);
	}

	// Reactive state using Svelte 5 runes
	let settings = $state<T>(loadSettings());

	return {
		get settings() {
			return settings;
		},

		getDefaults() {
			return { ...defaultSettings };
		},

		initialize() {
			if (!browser) return;
			settings = loadSettings();
		},

		set<K extends keyof T>(key: K, value: T[K]) {
			settings = { ...settings, [key]: value };
			saveSettings(settings);
		},

		update(updates: Partial<T>) {
			settings = { ...settings, ...updates };
			saveSettings(settings);
		},

		reset() {
			settings = { ...defaultSettings };
			saveSettings(settings);
		},

		toggleImmersiveMode() {
			if ('immersiveModeEnabled' in settings) {
				const current = settings.immersiveModeEnabled as boolean;
				settings = { ...settings, immersiveModeEnabled: !current };
				saveSettings(settings);
			}
		},
	};
}
