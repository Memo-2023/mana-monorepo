/**
 * Settings Store - Manages user preferences for the calendar app
 * Uses Svelte 5 runes and localStorage for persistence
 */

import { browser } from '$app/environment';
import type { CalendarViewType } from '@calendar/shared';

// Settings types
export type WeekStartDay = 0 | 1; // 0 = Sunday, 1 = Monday
export type TimeFormat = '24h' | '12h';

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
	hideEarlyHours: false,
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
	get hideEarlyHours() {
		return settings.hideEarlyHours;
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

	/**
	 * Toggle sidebar collapsed state
	 */
	toggleSidebar() {
		settings = { ...settings, sidebarCollapsed: !settings.sidebarCollapsed };
		saveSettings(settings);
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
	},

	/**
	 * Update multiple settings at once
	 */
	update(updates: Partial<CalendarAppSettings>) {
		settings = { ...settings, ...updates };
		saveSettings(settings);
	},

	/**
	 * Reset all settings to defaults
	 */
	reset() {
		settings = { ...DEFAULT_SETTINGS };
		saveSettings(settings);
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
