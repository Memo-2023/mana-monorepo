/**
 * Cross-App IndexedDB Readers
 *
 * Opens other apps' IndexedDB databases for direct read access.
 * All apps on the same origin share IndexedDB, so ManaCore can
 * read from manacore-todo, manacore-calendar, etc. directly.
 *
 * Data is reactive via Dexie's liveQuery — updates when any app
 * writes to the same database (including via sync).
 *
 * NOTE: These stores are read-only from ManaCore's perspective.
 * Writes that need sync should go through the owning app's collections.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';

// ─── Todo Types ─────────────────────────────────────────────

export interface CrossAppTask extends BaseRecord {
	title: string;
	description?: string;
	projectId?: string | null;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	isCompleted: boolean;
	completedAt?: string | null;
	dueDate?: string | null;
	dueTime?: string | null;
	scheduledDate?: string | null;
	estimatedDuration?: number | null;
	order: number;
	subtasks?: { id: string; title: string; isCompleted: boolean; order: number }[] | null;
	labels?: { id: string; name: string; color: string }[];
}

export interface CrossAppProject extends BaseRecord {
	name: string;
	color: string;
	icon?: string | null;
	order: number;
	isArchived: boolean;
	isDefault: boolean;
}

// ─── Calendar Types ─────────────────────────────────────────

export interface CrossAppEvent extends BaseRecord {
	calendarId: string;
	title: string;
	description?: string | null;
	startDate: string;
	endDate: string;
	allDay: boolean;
	location?: string | null;
	recurrenceRule?: string | null;
	color?: string | null;
}

export interface CrossAppCalendar extends BaseRecord {
	name: string;
	color: string;
	isDefault: boolean;
	isVisible: boolean;
}

// ─── Contacts Types ─────────────────────────────────────────

export interface CrossAppContact extends BaseRecord {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	company?: string;
	jobTitle?: string;
	photoUrl?: string;
	isFavorite?: boolean;
	isArchived?: boolean;
}

// ─── Store Instances ────────────────────────────────────────
// These open existing IndexedDB databases created by other apps.
// No sync config — ManaCore only reads, the owning app handles sync.

export const todoReader = createLocalStore({
	appId: 'todo',
	collections: [
		{
			name: 'tasks',
			indexes: [
				'projectId',
				'dueDate',
				'isCompleted',
				'priority',
				'order',
				'[isCompleted+order]',
				'[projectId+order]',
			],
		},
		{
			name: 'projects',
			indexes: ['order', 'isArchived'],
		},
	],
});

export const calendarReader = createLocalStore({
	appId: 'calendar',
	collections: [
		{
			name: 'events',
			indexes: ['calendarId', 'startDate', 'endDate', 'allDay', '[calendarId+startDate]'],
		},
		{
			name: 'calendars',
			indexes: ['isDefault', 'isVisible'],
		},
	],
});

export const contactsReader = createLocalStore({
	appId: 'contacts',
	collections: [
		{
			name: 'contacts',
			indexes: ['firstName', 'lastName', 'email', 'company', 'isFavorite', 'isArchived'],
		},
	],
});

// Typed collection accessors
export const crossTaskCollection = todoReader.collection<CrossAppTask>('tasks');
export const crossProjectCollection = todoReader.collection<CrossAppProject>('projects');
export const crossEventCollection = calendarReader.collection<CrossAppEvent>('events');
export const crossCalendarCollection = calendarReader.collection<CrossAppCalendar>('calendars');
export const crossContactCollection = contactsReader.collection<CrossAppContact>('contacts');
