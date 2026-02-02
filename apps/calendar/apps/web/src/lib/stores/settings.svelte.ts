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
export type WeekdayFormat = 'full' | 'short' | 'hidden';
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

	// Header settings
	headerCompact: boolean;
	headerWeekdayFormat: WeekdayFormat;
	headerShowDate: boolean;
	headerAlwaysShowMonth: boolean;

	// DateStrip settings
	dateStripShowMoonPhases: boolean;
	dateStripShowEventIndicators: boolean;
	dateStripShowWeekday: boolean;
	dateStripHighlightWeekends: boolean;
	dateStripShowMonthDividers: boolean;
	dateStripCompact: boolean;
	dateStripShowWeekNumbers: boolean;
	dateStripCollapsed: boolean;

	// TagStrip settings
	tagStripCollapsed: boolean;
	selectedTagIds: string[];

	// Immersive Mode settings
	immersiveModeEnabled: boolean;

	// Birthday settings
	showBirthdays: boolean;
	showBirthdayAge: boolean;

	// Task settings
	showTasksInCalendar: boolean;

	// UI settings
	sidebarCollapsed: boolean;

	// Quick View Pill settings
	quickViewPillViews: CalendarViewType[];
	customDayCount: number;

	// Event defaults
	defaultEventDuration: number;
	defaultReminder: number;

	// Voice input settings
	sttLanguage: SttLanguage;
}

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
	headerCompact: false,
	headerWeekdayFormat: 'full',
	headerShowDate: true,
	headerAlwaysShowMonth: false,
	dateStripShowMoonPhases: true,
	dateStripShowEventIndicators: true,
	dateStripShowWeekday: true,
	dateStripHighlightWeekends: true,
	dateStripShowMonthDividers: true,
	dateStripCompact: false,
	dateStripShowWeekNumbers: false,
	dateStripCollapsed: false,
	tagStripCollapsed: true,
	selectedTagIds: [],
	immersiveModeEnabled: false,
	showBirthdays: true,
	showBirthdayAge: true,
	showTasksInCalendar: false,
	sidebarCollapsed: false,
	quickViewPillViews: ['week', 'month', 'agenda'],
	customDayCount: 30,
	defaultEventDuration: 60,
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
	toggleImmersiveMode: baseStore.toggleImmersiveMode,

	// Convenience getters
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
	get headerCompact() {
		return baseStore.settings.headerCompact;
	},
	get headerWeekdayFormat() {
		return baseStore.settings.headerWeekdayFormat;
	},
	get headerShowDate() {
		return baseStore.settings.headerShowDate;
	},
	get headerAlwaysShowMonth() {
		return baseStore.settings.headerAlwaysShowMonth;
	},
	get dateStripShowMoonPhases() {
		return baseStore.settings.dateStripShowMoonPhases;
	},
	get dateStripShowEventIndicators() {
		return baseStore.settings.dateStripShowEventIndicators;
	},
	get dateStripShowWeekday() {
		return baseStore.settings.dateStripShowWeekday;
	},
	get dateStripHighlightWeekends() {
		return baseStore.settings.dateStripHighlightWeekends;
	},
	get dateStripShowMonthDividers() {
		return baseStore.settings.dateStripShowMonthDividers;
	},
	get dateStripCompact() {
		return baseStore.settings.dateStripCompact;
	},
	get dateStripShowWeekNumbers() {
		return baseStore.settings.dateStripShowWeekNumbers;
	},
	get dateStripCollapsed() {
		return baseStore.settings.dateStripCollapsed;
	},
	get tagStripCollapsed() {
		return baseStore.settings.tagStripCollapsed;
	},
	get selectedTagIds() {
		return baseStore.settings.selectedTagIds;
	},
	get hasSelectedTags() {
		return baseStore.settings.selectedTagIds.length > 0;
	},
	get immersiveModeEnabled() {
		return baseStore.settings.immersiveModeEnabled;
	},
	get showBirthdays() {
		return baseStore.settings.showBirthdays;
	},
	get showBirthdayAge() {
		return baseStore.settings.showBirthdayAge;
	},
	get showTasksInCalendar() {
		return baseStore.settings.showTasksInCalendar;
	},
	get defaultEventDuration() {
		return baseStore.settings.defaultEventDuration;
	},
	get defaultReminder() {
		return baseStore.settings.defaultReminder;
	},
	get sidebarCollapsed() {
		return baseStore.settings.sidebarCollapsed;
	},
	get quickViewPillViews() {
		return baseStore.settings.quickViewPillViews;
	},
	get customDayCount() {
		return baseStore.settings.customDayCount;
	},
	get sttLanguage() {
		return baseStore.settings.sttLanguage;
	},
	get cloudSyncEnabled() {
		return cloudSyncEnabled;
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

	// Calendar-specific toggle methods
	toggleSidebar() {
		baseStore.set('sidebarCollapsed', !baseStore.settings.sidebarCollapsed);
	},

	toggleTagStrip() {
		baseStore.set('tagStripCollapsed', !baseStore.settings.tagStripCollapsed);
	},

	toggleTagSelection(tagId: string) {
		const currentIds = baseStore.settings.selectedTagIds;
		const isSelected = currentIds.includes(tagId);
		const newIds = isSelected ? currentIds.filter((id) => id !== tagId) : [...currentIds, tagId];
		baseStore.set('selectedTagIds', newIds);
	},

	isTagSelected(tagId: string): boolean {
		return baseStore.settings.selectedTagIds.includes(tagId);
	},

	clearTagSelection() {
		baseStore.set('selectedTagIds', []);
	},

	toggleTasksInCalendar() {
		baseStore.set('showTasksInCalendar', !baseStore.settings.showTasksInCalendar);
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
