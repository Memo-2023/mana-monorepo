/**
 * User Settings Store - Manages user preferences using Svelte 5 runes
 */

import { browser } from '$app/environment';

export interface UserSettings {
	timeFormat: '12h' | '24h';
	firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
	showSeconds: boolean;
	defaultAlarmSound: string;
	vibrationEnabled: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
	timeFormat: '24h',
	firstDayOfWeek: 1, // Monday (European default)
	showSeconds: false,
	defaultAlarmSound: 'default',
	vibrationEnabled: true,
};

const STORAGE_KEY = 'clock_user_settings';

// Load settings from localStorage
function loadSettings(): UserSettings {
	if (!browser) return DEFAULT_SETTINGS;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
		}
	} catch (e) {
		console.error('Failed to load user settings:', e);
	}
	return DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveSettings(settings: UserSettings) {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch (e) {
		console.error('Failed to save user settings:', e);
	}
}

// State
let settings = $state<UserSettings>(loadSettings());

export const userSettings = {
	// Getters
	get timeFormat() {
		return settings.timeFormat;
	},
	get firstDayOfWeek() {
		return settings.firstDayOfWeek;
	},
	get showSeconds() {
		return settings.showSeconds;
	},
	get defaultAlarmSound() {
		return settings.defaultAlarmSound;
	},
	get vibrationEnabled() {
		return settings.vibrationEnabled;
	},
	get all() {
		return settings;
	},

	/**
	 * Update a single setting
	 */
	update<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
		settings = { ...settings, [key]: value };
		saveSettings(settings);
	},

	/**
	 * Update multiple settings
	 */
	updateMany(updates: Partial<UserSettings>) {
		settings = { ...settings, ...updates };
		saveSettings(settings);
	},

	/**
	 * Reset to defaults
	 */
	reset() {
		settings = DEFAULT_SETTINGS;
		saveSettings(settings);
	},

	/**
	 * Initialize (reload from storage)
	 */
	initialize() {
		settings = loadSettings();
	},
};
