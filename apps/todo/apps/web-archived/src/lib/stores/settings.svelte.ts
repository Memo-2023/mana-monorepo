/**
 * Settings Store - Manages user preferences for the Todo app
 * Uses @manacore/shared-stores createAppSettingsStore factory
 */

import { createAppSettingsStore } from '@manacore/shared-stores';
import type { TaskPriority } from '@todo/shared';

// Settings types
export type TodoView = 'inbox' | 'today' | 'upcoming' | 'kanban' | 'completed';
export type KanbanCardSize = 'compact' | 'normal' | 'large';
export type LayoutMode = 'fokus' | 'uebersicht' | 'matrix';
export type PageMode = 'date' | 'priority' | 'custom'; // deprecated — will be replaced by BoardView

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
export type PageWidth = 'narrow' | 'medium' | 'wide' | 'full';

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
	defaultTaskDuration: number; // minutes, auto-learned or manual

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

	// Page mode (deprecated — migrating to BoardView)
	pageMode: PageMode;
	pageWidth: PageWidth;
	customPages: PageConfig[];
}

const DEFAULT_SETTINGS: TodoAppSettings = {
	// Task Behavior
	defaultPriority: 'medium',
	defaultDueTime: '09:00',
	autoArchiveCompletedDays: null,
	quickAddProject: null,

	// View & Display
	defaultView: 'inbox',
	showTaskCounts: true,
	compactMode: false,
	showSubtaskProgress: true,
	groupByProject: false,

	// Kanban Board
	kanbanCardSize: 'normal',
	showLabelsOnCards: true,
	wipLimitPerColumn: null,

	// Notifications & Reminders
	defaultReminderMinutes: null,
	dailyDigestEnabled: false,
	overdueNotifications: true,

	// Smart Duration
	smartDurationEnabled: true,
	defaultTaskDuration: 30, // 30 min default, auto-learned over time

	// Productivity
	focusMode: false,
	pomodoroEnabled: false,
	dailyGoal: null,
	showStreak: false,

	// Immersive Mode
	immersiveModeEnabled: false,

	// Navigation UI
	filterStripCollapsed: false, // FilterStrip shown by default when PillNav is visible

	// View layout
	activeLayoutMode: 'fokus' as LayoutMode,

	// Page mode (deprecated)
	pageMode: 'priority' as PageMode,
	pageWidth: 'medium' as PageWidth,
	customPages: [] as PageConfig[],
};

// Create base store using factory
const baseStore = createAppSettingsStore<TodoAppSettings>('todo-settings', DEFAULT_SETTINGS);

// Export with convenience getters for backwards compatibility
export const todoSettings = {
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

	// Convenience getters (backwards compatible)
	get defaultPriority() {
		return baseStore.settings.defaultPriority;
	},
	get defaultDueTime() {
		return baseStore.settings.defaultDueTime;
	},
	get autoArchiveCompletedDays() {
		return baseStore.settings.autoArchiveCompletedDays;
	},
	get quickAddProject() {
		return baseStore.settings.quickAddProject;
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
	get groupByProject() {
		return baseStore.settings.groupByProject;
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
	get defaultReminderMinutes() {
		return baseStore.settings.defaultReminderMinutes;
	},
	get dailyDigestEnabled() {
		return baseStore.settings.dailyDigestEnabled;
	},
	get overdueNotifications() {
		return baseStore.settings.overdueNotifications;
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
	get pomodoroEnabled() {
		return baseStore.settings.pomodoroEnabled;
	},
	get dailyGoal() {
		return baseStore.settings.dailyGoal;
	},
	get showStreak() {
		return baseStore.settings.showStreak;
	},
	get immersiveModeEnabled() {
		return baseStore.settings.immersiveModeEnabled;
	},
	get filterStripCollapsed() {
		return baseStore.settings.filterStripCollapsed;
	},
	get activeLayoutMode() {
		return baseStore.settings.activeLayoutMode;
	},
	get pageMode() {
		return baseStore.settings.pageMode;
	},
	get pageWidth() {
		return baseStore.settings.pageWidth;
	},
	get customPages() {
		return baseStore.settings.customPages;
	},

	// Toggle methods
	toggleFilterStrip() {
		baseStore.update({ filterStripCollapsed: !baseStore.settings.filterStripCollapsed });
	},
};
