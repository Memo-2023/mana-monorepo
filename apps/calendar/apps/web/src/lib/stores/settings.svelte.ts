/**
 * Settings Store - Manages user preferences for the calendar app
 * Uses Svelte 5 runes with:
 * - localStorage for immediate persistence
 * - userSettings store for cloud sync (device-specific)
 */

import { browser } from '$app/environment';
import type { CalendarViewType } from '@calendar/shared';
import { userSettings } from './user-settings.svelte';

// Settings types
export type WeekStartDay = 0 | 1; // 0 = Sunday, 1 = Monday
export type TimeFormat = '24h' | '12h';
export type AllDayDisplayMode = 'header' | 'block'; // header = separate row, block = full day block in grid

export interface CalendarAppSettings {
	// View settings
	defaultView: CalendarViewType;
	weekStartsOn: WeekStartDay;
	showOnlyWeekdays: boolean;
	showWeekNumbers: boolean;
	timeFormat: TimeFormat;
	filterHoursEnabled: boolean; // Filter visible hours
	dayStartHour: number; // First visible hour (0-23)
	dayEndHour: number; // Last visible hour (0-23)
	allDayDisplayMode: AllDayDisplayMode; // How to display all-day events

	// DateStrip settings
	dateStripShowMoonPhases: boolean; // Show moon phase indicators
	dateStripShowEventIndicators: boolean; // Show event dot indicators
	dateStripShowWeekday: boolean; // Show weekday names (Mo, Di, Mi...)
	dateStripHighlightWeekends: boolean; // Visually highlight weekend days
	dateStripShowMonthDividers: boolean; // Show vertical dividers between months
	dateStripCompact: boolean; // Use compact/smaller DateStrip
	dateStripShowWeekNumbers: boolean; // Show week numbers at start of week

	// Birthday settings (cross-app integration with Contacts)
	showBirthdays: boolean; // Show contact birthdays in calendar
	showBirthdayAge: boolean; // Show age in birthday events

	// UI settings
	sidebarCollapsed: boolean;

	// Event defaults
	defaultEventDuration: number; // in minutes
	defaultReminder: number; // in minutes before event
}

const DEFAULT_SETTINGS: CalendarAppSettings = {
	defaultView: 'week',
	weekStartsOn: 1, // Monday
	showOnlyWeekdays: false,
	showWeekNumbers: false,
	timeFormat: '24h',
	filterHoursEnabled: false,
	dayStartHour: 6,
	dayEndHour: 20,
	allDayDisplayMode: 'header',
	// DateStrip defaults
	dateStripShowMoonPhases: true,
	dateStripShowEventIndicators: true,
	dateStripShowWeekday: true,
	dateStripHighlightWeekends: true,
	dateStripShowMonthDividers: true,
	dateStripCompact: false,
	dateStripShowWeekNumbers: false,
	// Birthday defaults
	showBirthdays: true,
	showBirthdayAge: true,
	// UI defaults
	sidebarCollapsed: false,
	defaultEventDuration: 60,
	defaultReminder: 15,
};

const STORAGE_KEY = 'calendar-settings';

// Load settings from localStorage
function loadSettings(): CalendarAppSettings {
	if (!browser) return DEFAULT_SETTINGS;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...DEFAULT_SETTINGS, ...parsed };
		}
	} catch (e) {
		console.error('Failed to load calendar settings:', e);
	}

	return DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveSettings(settings: CalendarAppSettings) {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch (e) {
		console.error('Failed to save calendar settings:', e);
	}
}

// State
let settings = $state<CalendarAppSettings>(loadSettings());
let cloudSyncEnabled = $state(false);
let initialSyncDone = $state(false);

/**
 * Sync settings to cloud (device-specific)
 */
async function syncToCloud() {
	if (!cloudSyncEnabled || !browser) return;

	try {
		await userSettings.updateDeviceAppSettings(settings as unknown as Record<string, unknown>);
	} catch (e) {
		console.error('Failed to sync calendar settings to cloud:', e);
	}
}

/**
 * Load settings from cloud (device-specific)
 */
function loadFromCloud(): Partial<CalendarAppSettings> | null {
	if (!userSettings.loaded) return null;

	const cloudSettings = userSettings.currentDeviceAppSettings;
	if (cloudSettings && Object.keys(cloudSettings).length > 0) {
		return cloudSettings as unknown as Partial<CalendarAppSettings>;
	}
	return null;
}

export const settingsStore = {
	// Getters
	get settings() {
		return settings;
	},
	get defaultView() {
		return settings.defaultView;
	},
	get weekStartsOn() {
		return settings.weekStartsOn;
	},
	get showOnlyWeekdays() {
		return settings.showOnlyWeekdays;
	},
	get showWeekNumbers() {
		return settings.showWeekNumbers;
	},
	get timeFormat() {
		return settings.timeFormat;
	},
	get filterHoursEnabled() {
		return settings.filterHoursEnabled;
	},
	get dayStartHour() {
		return settings.dayStartHour;
	},
	get dayEndHour() {
		return settings.dayEndHour;
	},
	get allDayDisplayMode() {
		return settings.allDayDisplayMode;
	},
	// DateStrip settings
	get dateStripShowMoonPhases() {
		return settings.dateStripShowMoonPhases;
	},
	get dateStripShowEventIndicators() {
		return settings.dateStripShowEventIndicators;
	},
	get dateStripShowWeekday() {
		return settings.dateStripShowWeekday;
	},
	get dateStripHighlightWeekends() {
		return settings.dateStripHighlightWeekends;
	},
	get dateStripShowMonthDividers() {
		return settings.dateStripShowMonthDividers;
	},
	get dateStripCompact() {
		return settings.dateStripCompact;
	},
	get dateStripShowWeekNumbers() {
		return settings.dateStripShowWeekNumbers;
	},
	// Birthday settings
	get showBirthdays() {
		return settings.showBirthdays;
	},
	get showBirthdayAge() {
		return settings.showBirthdayAge;
	},
	get defaultEventDuration() {
		return settings.defaultEventDuration;
	},
	get defaultReminder() {
		return settings.defaultReminder;
	},
	get sidebarCollapsed() {
		return settings.sidebarCollapsed;
	},
	get cloudSyncEnabled() {
		return cloudSyncEnabled;
	},

	/**
	 * Enable cloud sync and load settings from cloud
	 */
	enableCloudSync() {
		cloudSyncEnabled = true;

		// On first sync, prefer cloud settings over local if they exist
		if (!initialSyncDone) {
			const cloudSettings = loadFromCloud();
			if (cloudSettings && Object.keys(cloudSettings).length > 0) {
				settings = { ...DEFAULT_SETTINGS, ...settings, ...cloudSettings };
				saveSettings(settings);
			} else {
				// No cloud settings yet, push local settings to cloud
				syncToCloud();
			}
			initialSyncDone = true;
		}
	},

	/**
	 * Disable cloud sync
	 */
	disableCloudSync() {
		cloudSyncEnabled = false;
	},

	/**
	 * Toggle sidebar collapsed state
	 */
	toggleSidebar() {
		settings = { ...settings, sidebarCollapsed: !settings.sidebarCollapsed };
		saveSettings(settings);
		syncToCloud();
	},

	/**
	 * Initialize settings from localStorage
	 */
	initialize() {
		if (!browser) return;
		settings = loadSettings();
	},

	/**
	 * Update a single setting
	 */
	set<K extends keyof CalendarAppSettings>(key: K, value: CalendarAppSettings[K]) {
		settings = { ...settings, [key]: value };
		saveSettings(settings);
		syncToCloud();
	},

	/**
	 * Update multiple settings at once
	 */
	update(updates: Partial<CalendarAppSettings>) {
		settings = { ...settings, ...updates };
		saveSettings(settings);
		syncToCloud();
	},

	/**
	 * Reset all settings to defaults
	 */
	reset() {
		settings = { ...DEFAULT_SETTINGS };
		saveSettings(settings);
		syncToCloud();
	},

	/**
	 * Format time according to user preference
	 */
	formatTime(date: Date): string {
		if (settings.timeFormat === '12h') {
			const hours = date.getHours();
			const minutes = date.getMinutes();
			const ampm = hours >= 12 ? 'PM' : 'AM';
			const displayHours = hours % 12 || 12;
			return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
		}
		return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
	},

	/**
	 * Format hour label according to user preference
	 */
	formatHour(hour: number): string {
		if (settings.timeFormat === '12h') {
			const ampm = hour >= 12 ? 'PM' : 'AM';
			const displayHour = hour % 12 || 12;
			return `${displayHour} ${ampm}`;
		}
		return `${hour.toString().padStart(2, '0')}:00`;
	},
};
