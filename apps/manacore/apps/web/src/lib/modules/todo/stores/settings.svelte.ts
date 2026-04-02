/**
 * Todo Settings Store — User preferences for the Todo module
 * Uses @manacore/shared-stores createAppSettingsStore factory
 */

import { createAppSettingsStore } from '@manacore/shared-stores';
import type { TaskPriority } from '../types';

// Settings types
export type TodoView = 'inbox' | 'today' | 'upcoming' | 'kanban' | 'completed';
export type KanbanCardSize = 'compact' | 'normal' | 'large';
export type LayoutMode = 'fokus' | 'uebersicht' | 'matrix';

export type PageIcon =
	| 'warning'
	| 'calendar'
	| 'calendar-dots'
	| 'check'
	| 'star'
	| 'lightning'
	| 'clock'
	| 'fire'
	| 'leaf'
	| 'heart';

export interface PageConfig {
	id: string;
	label: string;
	icon?: PageIcon;
	filter: {
		priorities?: ('low' | 'medium' | 'high' | 'urgent')[];
		completed?: boolean;
		dateRange?: 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'any';
	};
}

export interface TodoAppSettings extends Record<string, unknown> {
	// Task Behavior
	defaultPriority: TaskPriority;
	defaultDueTime: string | null;
	autoArchiveCompletedDays: number | null;
	quickAddProject: string | null;

	// View & Display
	defaultView: TodoView;
	showTaskCounts: boolean;
	compactMode: boolean;
	showSubtaskProgress: boolean;
	groupByProject: boolean;

	// Kanban Board
	kanbanCardSize: KanbanCardSize;
	showLabelsOnCards: boolean;
	wipLimitPerColumn: number | null;

	// Notifications & Reminders
	defaultReminderMinutes: number | null;
	dailyDigestEnabled: boolean;
	overdueNotifications: boolean;

	// Smart Duration
	smartDurationEnabled: boolean;
	defaultTaskDuration: number;

	// Productivity
	focusMode: boolean;
	pomodoroEnabled: boolean;
	dailyGoal: number | null;
	showStreak: boolean;

	// Immersive Mode
	immersiveModeEnabled: boolean;

	// Navigation UI
	filterStripCollapsed: boolean;

	// View layout
	activeLayoutMode: LayoutMode;

	// Custom pages
	customPages: PageConfig[];
}

const DEFAULT_SETTINGS: TodoAppSettings = {
	defaultPriority: 'medium',
	defaultDueTime: '09:00',
	autoArchiveCompletedDays: null,
	quickAddProject: null,

	defaultView: 'inbox',
	showTaskCounts: true,
	compactMode: false,
	showSubtaskProgress: true,
	groupByProject: false,

	kanbanCardSize: 'normal',
	showLabelsOnCards: true,
	wipLimitPerColumn: null,

	defaultReminderMinutes: null,
	dailyDigestEnabled: false,
	overdueNotifications: true,

	smartDurationEnabled: true,
	defaultTaskDuration: 30,

	focusMode: false,
	pomodoroEnabled: false,
	dailyGoal: null,
	showStreak: false,

	immersiveModeEnabled: false,
	filterStripCollapsed: false,
	activeLayoutMode: 'fokus' as LayoutMode,
	customPages: [] as PageConfig[],
};

const baseStore = createAppSettingsStore<TodoAppSettings>('todo-settings', DEFAULT_SETTINGS);

export const todoSettings = {
	get settings() {
		return baseStore.settings;
	},
	initialize: baseStore.initialize,
	set: baseStore.set,
	update: baseStore.update,
	reset: baseStore.reset,
	getDefaults: baseStore.getDefaults,

	// Convenience getters
	get defaultPriority() {
		return baseStore.settings.defaultPriority;
	},
	get defaultView() {
		return baseStore.settings.defaultView;
	},
	get showTaskCounts() {
		return baseStore.settings.showTaskCounts;
	},
	get compactMode() {
		return baseStore.settings.compactMode;
	},
	get showSubtaskProgress() {
		return baseStore.settings.showSubtaskProgress;
	},
	get kanbanCardSize() {
		return baseStore.settings.kanbanCardSize;
	},
	get showLabelsOnCards() {
		return baseStore.settings.showLabelsOnCards;
	},
	get wipLimitPerColumn() {
		return baseStore.settings.wipLimitPerColumn;
	},
	get smartDurationEnabled() {
		return baseStore.settings.smartDurationEnabled;
	},
	get defaultTaskDuration() {
		return baseStore.settings.defaultTaskDuration;
	},
	get focusMode() {
		return baseStore.settings.focusMode;
	},
	get activeLayoutMode() {
		return baseStore.settings.activeLayoutMode;
	},
	get filterStripCollapsed() {
		return baseStore.settings.filterStripCollapsed;
	},

	get customPages() {
		return baseStore.settings.customPages;
	},

	toggleFilterStrip() {
		baseStore.update({ filterStripCollapsed: !baseStore.settings.filterStripCollapsed });
	},
};
