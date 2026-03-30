/**
 * Settings Store - Manages user preferences for the calendar app
 * Uses @manacore/shared-stores createAppSettingsStore factory with cloud sync
 */

import { browser } from '$app/environment';
import type { CalendarViewType } from '@calendar/shared';
import { createAppSettingsStore } from '@manacore/shared-stores';
import { userSettings } from './user-settings.svelte';

// Settings types
export type WeekStartDay = 0 | 1;
export type TimeFormat = '24h' | '12h';
export type AllDayDisplayMode = 'header' | 'block';
export type SttLanguage = 'de' | 'auto';

export interface CalendarAppSettings extends Record<string, unknown> {
	// View settings
	defaultView: CalendarViewType;
	weekStartsOn: WeekStartDay;
	showOnlyWeekdays: boolean;
	showWeekNumbers: boolean;
	timeFormat: TimeFormat;
	filterHoursEnabled: boolean;
	dayStartHour: number;
	dayEndHour: number;
	allDayDisplayMode: AllDayDisplayMode;

	// Display settings
	showBirthdays: boolean;
	showBirthdayAge: boolean;
	dateStripShowMoonPhases: boolean;
	dateStripShowEventIndicators: boolean;
	dateStripHighlightWeekends: boolean;
	dateStripCompact: boolean;

	// Event defaults
	defaultEventDuration: number;
	smartDurationEnabled: boolean;
	defaultReminder: number;

	// Voice input settings
	sttLanguage: SttLanguage;
}

// --- UI state (not persisted, resets on page load) ---
let _dateStripCollapsed = $state(false);
let _tagStripCollapsed = $state(true);
let _selectedTagIds = $state<string[]>([]);
let _immersiveModeEnabled = $state(false);
let _showTasksInCalendar = $state(false);
let _sidebarCollapsed = $state(true);

const DEFAULT_SETTINGS: CalendarAppSettings = {
	defaultView: 'week',
	weekStartsOn: 1,
	showOnlyWeekdays: false,
	showWeekNumbers: false,
	timeFormat: '24h',
	filterHoursEnabled: false,
	dayStartHour: 6,
	dayEndHour: 20,
	allDayDisplayMode: 'header',
	dateStripShowMoonPhases: true,
	dateStripShowEventIndicators: true,
	dateStripHighlightWeekends: true,
	dateStripCompact: false,
	showBirthdays: true,
	showBirthdayAge: true,
	defaultEventDuration: 60,
	smartDurationEnabled: true,
	defaultReminder: 15,
	sttLanguage: 'de',
};

// Cloud sync state
let cloudSyncEnabled = $state(false);
let initialSyncDone = $state(false);

// Sync to cloud callback
async function syncToCloud(settings: CalendarAppSettings) {
	if (!cloudSyncEnabled || !browser) return;
	try {
		await userSettings.updateDeviceAppSettings(settings as unknown as Record<string, unknown>);
	} catch (e) {
		console.error('Failed to sync calendar settings to cloud:', e);
	}
}

// Create base store with cloud sync callback
const baseStore = createAppSettingsStore<CalendarAppSettings>(
	'calendar-settings',
	DEFAULT_SETTINGS,
	{
		onSettingsChange: syncToCloud,
	}
);

// Migrate: strip removed keys from localStorage to keep it clean
if (browser) {
	try {
		const raw = localStorage.getItem('calendar-settings');
		if (raw) {
			const stored = JSON.parse(raw);
			const removedKeys = [
				'headerCompact',
				'headerWeekdayFormat',
				'headerShowDate',
				'headerAlwaysShowMonth',
				'dateStripShowWeekday',
				'dateStripShowMonthDividers',
				'dateStripShowWeekNumbers',
				'dateStripCollapsed',
				'tagStripCollapsed',
				'selectedTagIds',
				'immersiveModeEnabled',
				'showTasksInCalendar',
				'sidebarCollapsed',
				'quickViewPillViews',
				'customDayCount',
			];
			let changed = false;
			for (const key of removedKeys) {
				if (key in stored) {
					delete stored[key];
					changed = true;
				}
			}
			if (changed) {
				localStorage.setItem('calendar-settings', JSON.stringify(stored));
			}
		}
	} catch {
		// ignore migration errors
	}
}

// Load settings from cloud
function loadFromCloud(): Partial<CalendarAppSettings> | null {
	if (!userSettings.loaded) return null;
	const cloudSettings = userSettings.currentDeviceAppSettings;
	if (cloudSettings && Object.keys(cloudSettings).length > 0) {
		return cloudSettings as unknown as Partial<CalendarAppSettings>;
	}
	return null;
}

export const settingsStore = {
	// Base store methods
	get settings() {
		return baseStore.settings;
	},
	initialize: baseStore.initialize,
	set: baseStore.set,
	update: baseStore.update,
	reset: baseStore.reset,
	getDefaults: baseStore.getDefaults,

	// Persisted preference getters
	get defaultView() {
		return baseStore.settings.defaultView;
	},
	get weekStartsOn() {
		return baseStore.settings.weekStartsOn;
	},
	get showOnlyWeekdays() {
		return baseStore.settings.showOnlyWeekdays;
	},
	get showWeekNumbers() {
		return baseStore.settings.showWeekNumbers;
	},
	get timeFormat() {
		return baseStore.settings.timeFormat;
	},
	get filterHoursEnabled() {
		return baseStore.settings.filterHoursEnabled;
	},
	get dayStartHour() {
		return baseStore.settings.dayStartHour;
	},
	get dayEndHour() {
		return baseStore.settings.dayEndHour;
	},
	get allDayDisplayMode() {
		return baseStore.settings.allDayDisplayMode;
	},
	get dateStripShowMoonPhases() {
		return baseStore.settings.dateStripShowMoonPhases;
	},
	get dateStripShowEventIndicators() {
		return baseStore.settings.dateStripShowEventIndicators;
	},
	get dateStripHighlightWeekends() {
		return baseStore.settings.dateStripHighlightWeekends;
	},
	get dateStripCompact() {
		return baseStore.settings.dateStripCompact;
	},
	get showBirthdays() {
		return baseStore.settings.showBirthdays;
	},
	get showBirthdayAge() {
		return baseStore.settings.showBirthdayAge;
	},
	get defaultEventDuration() {
		return baseStore.settings.defaultEventDuration;
	},
	get smartDurationEnabled() {
		return baseStore.settings.smartDurationEnabled;
	},
	get defaultReminder() {
		return baseStore.settings.defaultReminder;
	},
	get sttLanguage() {
		return baseStore.settings.sttLanguage;
	},
	get cloudSyncEnabled() {
		return cloudSyncEnabled;
	},

	// --- UI state getters (non-persisted) ---
	get dateStripCollapsed() {
		return _dateStripCollapsed;
	},
	get tagStripCollapsed() {
		return _tagStripCollapsed;
	},
	get selectedTagIds() {
		return _selectedTagIds;
	},
	get hasSelectedTags() {
		return _selectedTagIds.length > 0;
	},
	get immersiveModeEnabled() {
		return _immersiveModeEnabled;
	},
	get showTasksInCalendar() {
		return _showTasksInCalendar;
	},
	get sidebarCollapsed() {
		return _sidebarCollapsed;
	},

	// Cloud sync methods
	enableCloudSync() {
		cloudSyncEnabled = true;
		if (!initialSyncDone) {
			const cloudSettings = loadFromCloud();
			if (cloudSettings && Object.keys(cloudSettings).length > 0) {
				baseStore.update(cloudSettings);
			} else {
				syncToCloud(baseStore.settings);
			}
			initialSyncDone = true;
		}
	},

	disableCloudSync() {
		cloudSyncEnabled = false;
	},

	// UI state toggle methods (non-persisted)
	toggleSidebar() {
		_sidebarCollapsed = !_sidebarCollapsed;
	},

	toggleTagStrip() {
		_tagStripCollapsed = !_tagStripCollapsed;
	},

	toggleTagSelection(tagId: string) {
		const isSelected = _selectedTagIds.includes(tagId);
		_selectedTagIds = isSelected
			? _selectedTagIds.filter((id) => id !== tagId)
			: [..._selectedTagIds, tagId];
	},

	isTagSelected(tagId: string): boolean {
		return _selectedTagIds.includes(tagId);
	},

	clearTagSelection() {
		_selectedTagIds = [];
	},

	toggleTasksInCalendar() {
		_showTasksInCalendar = !_showTasksInCalendar;
	},

	toggleImmersiveMode() {
		_immersiveModeEnabled = !_immersiveModeEnabled;
	},

	setDateStripCollapsed(value: boolean) {
		_dateStripCollapsed = value;
	},

	// Time formatting helpers
	formatTime(date: Date): string {
		if (baseStore.settings.timeFormat === '12h') {
			const hours = date.getHours();
			const minutes = date.getMinutes();
			const ampm = hours >= 12 ? 'PM' : 'AM';
			const displayHours = hours % 12 || 12;
			return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
		}
		return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
	},

	formatHour(hour: number): string {
		if (baseStore.settings.timeFormat === '12h') {
			const ampm = hour >= 12 ? 'PM' : 'AM';
			const displayHour = hour % 12 || 12;
			return `${displayHour} ${ampm}`;
		}
		return `${hour.toString().padStart(2, '0')}:00`;
	},
};
