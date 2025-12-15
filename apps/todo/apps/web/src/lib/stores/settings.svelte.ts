/**
 * Settings Store - Manages user preferences for the Todo app
 * Uses Svelte 5 runes and localStorage for persistence
 */

import { browser } from '$app/environment';
import type { TaskPriority } from '@todo/shared';

// Settings types
export type TodoView = 'inbox' | 'today' | 'upcoming' | 'kanban' | 'completed';
export type KanbanCardSize = 'compact' | 'normal' | 'large';

export interface TodoAppSettings {
	// Task Behavior
	/** Default priority for new tasks */
	defaultPriority: TaskPriority;
	/** Default due time for tasks (HH:mm format, null = no default) */
	defaultDueTime: string | null;
	/** Auto-archive completed tasks after X days (null = disabled) */
	autoArchiveCompletedDays: number | null;
	/** Default project for quick add (null = inbox) */
	quickAddProject: string | null;

	// View & Display
	/** Default view when opening the app */
	defaultView: TodoView;
	/** Show task counts as badges in navigation */
	showTaskCounts: boolean;
	/** Compact mode with reduced padding */
	compactMode: boolean;
	/** Show progress bar for subtasks */
	showSubtaskProgress: boolean;
	/** Group tasks by project in list views */
	groupByProject: boolean;

	// Kanban Board
	/** Kanban card size */
	kanbanCardSize: KanbanCardSize;
	/** Show labels on kanban cards */
	showLabelsOnCards: boolean;
	/** Work-in-progress limit per column (null = unlimited) */
	wipLimitPerColumn: number | null;

	// Notifications & Reminders
	/** Default reminder time in minutes before due (null = no default) */
	defaultReminderMinutes: number | null;
	/** Enable daily digest email/notification */
	dailyDigestEnabled: boolean;
	/** Notify about overdue tasks */
	overdueNotifications: boolean;

	// Productivity
	/** Focus mode - show only current task */
	focusMode: boolean;
	/** Enable pomodoro timer */
	pomodoroEnabled: boolean;
	/** Daily task completion goal (null = no goal) */
	dailyGoal: number | null;
	/** Show productivity streak */
	showStreak: boolean;

	// Immersive Mode
	/** Fullscreen mode - hides all UI elements */
	immersiveModeEnabled: boolean;
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

	// Productivity
	focusMode: false,
	pomodoroEnabled: false,
	dailyGoal: null,
	showStreak: false,

	// Immersive Mode
	immersiveModeEnabled: false,
};

const STORAGE_KEY = 'todo-settings';

// Load settings from localStorage
function loadSettings(): TodoAppSettings {
	if (!browser) return DEFAULT_SETTINGS;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Merge with defaults to handle new settings added in updates
			return { ...DEFAULT_SETTINGS, ...parsed };
		}
	} catch (e) {
		console.error('Failed to load todo settings:', e);
	}

	return DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveSettings(settings: TodoAppSettings) {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch (e) {
		console.error('Failed to save todo settings:', e);
	}
}

// State
let settings = $state<TodoAppSettings>(loadSettings());

export const todoSettings = {
	// Full settings object
	get settings() {
		return settings;
	},

	// Task Behavior
	get defaultPriority() {
		return settings.defaultPriority;
	},
	get defaultDueTime() {
		return settings.defaultDueTime;
	},
	get autoArchiveCompletedDays() {
		return settings.autoArchiveCompletedDays;
	},
	get quickAddProject() {
		return settings.quickAddProject;
	},

	// View & Display
	get defaultView() {
		return settings.defaultView;
	},
	get showTaskCounts() {
		return settings.showTaskCounts;
	},
	get compactMode() {
		return settings.compactMode;
	},
	get showSubtaskProgress() {
		return settings.showSubtaskProgress;
	},
	get groupByProject() {
		return settings.groupByProject;
	},

	// Kanban Board
	get kanbanCardSize() {
		return settings.kanbanCardSize;
	},
	get showLabelsOnCards() {
		return settings.showLabelsOnCards;
	},
	get wipLimitPerColumn() {
		return settings.wipLimitPerColumn;
	},

	// Notifications & Reminders
	get defaultReminderMinutes() {
		return settings.defaultReminderMinutes;
	},
	get dailyDigestEnabled() {
		return settings.dailyDigestEnabled;
	},
	get overdueNotifications() {
		return settings.overdueNotifications;
	},

	// Productivity
	get focusMode() {
		return settings.focusMode;
	},
	get pomodoroEnabled() {
		return settings.pomodoroEnabled;
	},
	get dailyGoal() {
		return settings.dailyGoal;
	},
	get showStreak() {
		return settings.showStreak;
	},

	// Immersive Mode
	get immersiveModeEnabled() {
		return settings.immersiveModeEnabled;
	},

	/**
	 * Toggle Immersive Mode (fullscreen, hide all UI)
	 */
	toggleImmersiveMode() {
		settings = { ...settings, immersiveModeEnabled: !settings.immersiveModeEnabled };
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
	set<K extends keyof TodoAppSettings>(key: K, value: TodoAppSettings[K]) {
		settings = { ...settings, [key]: value };
		saveSettings(settings);
	},

	/**
	 * Update multiple settings at once
	 */
	update(updates: Partial<TodoAppSettings>) {
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
	 * Get default settings (for reference)
	 */
	getDefaults() {
		return DEFAULT_SETTINGS;
	},
};
