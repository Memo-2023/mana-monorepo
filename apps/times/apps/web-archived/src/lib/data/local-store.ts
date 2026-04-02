/**
 * Times — Local-First Data Layer
 *
 * IndexedDB (Dexie.js) with sync support for time tracking.
 * Clients, projects, time entries, tags, templates, and settings.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import {
	guestClients,
	guestProjects,
	guestTimeEntries,
	guestTags,
	guestSettings,
	guestAlarms,
	guestWorldClocks,
} from './guest-seed';
import type {
	BillingRate,
	ProjectVisibility,
	EntrySourceRef,
	CountdownTimerStatus,
} from '@times/shared';

// ─── Types ──────────────────────────────────────────────────

export interface LocalClient extends BaseRecord {
	name: string;
	shortCode?: string | null;
	contactId?: string | null;
	email?: string | null;
	color: string;
	isArchived: boolean;
	billingRate?: BillingRate | null;
	notes?: string | null;
	order: number;
}

export interface LocalProject extends BaseRecord {
	clientId?: string | null;
	name: string;
	description?: string | null;
	color: string;
	isArchived: boolean;
	isBillable: boolean;
	billingRate?: BillingRate | null;
	budget?: {
		type: 'hours' | 'fixed';
		amount: number;
		currency?: string;
	} | null;
	visibility: ProjectVisibility;
	guildId?: string | null;
	order: number;
}

export interface LocalTimeEntry extends BaseRecord {
	projectId?: string | null;
	clientId?: string | null;
	description: string;
	date: string;
	startTime?: string | null;
	endTime?: string | null;
	duration: number;
	isBillable: boolean;
	isRunning: boolean;
	tags: string[];
	billingRate?: BillingRate | null;
	visibility: ProjectVisibility;
	guildId?: string | null;
	source?: EntrySourceRef | null;
}

export interface LocalTag extends BaseRecord {
	name: string;
	color: string;
	order: number;
}

export interface LocalTemplate extends BaseRecord {
	name: string;
	projectId?: string | null;
	clientId?: string | null;
	description: string;
	isBillable: boolean;
	tags: string[];
	usageCount: number;
	lastUsedAt?: string | null;
}

export interface LocalSettings extends BaseRecord {
	defaultBillingRate?: BillingRate | null;
	workingHoursPerDay: number;
	workingDaysPerWeek: number;
	roundingIncrement: number;
	roundingMethod: 'none' | 'up' | 'down' | 'nearest';
	defaultVisibility: ProjectVisibility;
	weekStartsOn: 0 | 1;
	timerReminderMinutes: number;
	autoStopTimerHours: number;
}

// ─── Clock Types ────────────────────────────────────────────

export interface LocalAlarm extends BaseRecord {
	label: string | null;
	time: string; // HH:mm format
	enabled: boolean;
	repeatDays: number[] | null; // [0-6] where 0 = Sunday
	snoozeMinutes: number | null;
	sound: string | null;
	vibrate: boolean | null;
}

export interface LocalCountdownTimer extends BaseRecord {
	label: string | null;
	durationSeconds: number;
	remainingSeconds: number | null;
	status: CountdownTimerStatus;
	startedAt: string | null;
	pausedAt: string | null;
	sound: string | null;
}

export interface LocalWorldClock extends BaseRecord {
	timezone: string; // IANA timezone e.g. 'America/New_York'
	cityName: string;
	sortOrder: number;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const timesStore = createLocalStore({
	appId: 'times',
	collections: [
		{
			name: 'clients',
			indexes: ['order', 'isArchived', 'shortCode'],
			guestSeed: guestClients,
		},
		{
			name: 'projects',
			indexes: ['clientId', 'isArchived', 'isBillable', 'guildId', 'visibility', 'order'],
			guestSeed: guestProjects,
		},
		{
			name: 'timeEntries',
			indexes: [
				'projectId',
				'clientId',
				'date',
				'isRunning',
				'[date+projectId]',
				'[date+clientId]',
				'guildId',
				'visibility',
			],
			guestSeed: guestTimeEntries,
		},
		{
			name: 'tags',
			indexes: ['name', 'order'],
			guestSeed: guestTags,
		},
		{
			name: 'templates',
			indexes: ['usageCount', 'lastUsedAt', 'projectId'],
		},
		{
			name: 'settings',
			indexes: [],
			guestSeed: guestSettings,
		},
		// ─── Clock Collections ───
		{
			name: 'alarms',
			indexes: ['enabled', 'time'],
			guestSeed: guestAlarms,
		},
		{
			name: 'countdownTimers',
			indexes: ['status'],
		},
		{
			name: 'worldClocks',
			indexes: ['sortOrder', 'timezone'],
			guestSeed: guestWorldClocks,
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const clientCollection = timesStore.collection<LocalClient>('clients');
export const projectCollection = timesStore.collection<LocalProject>('projects');
export const timeEntryCollection = timesStore.collection<LocalTimeEntry>('timeEntries');
export const tagCollection = timesStore.collection<LocalTag>('tags');
export const templateCollection = timesStore.collection<LocalTemplate>('templates');
export const settingsCollection = timesStore.collection<LocalSettings>('settings');

// Clock collection accessors
export const alarmCollection = timesStore.collection<LocalAlarm>('alarms');
export const countdownTimerCollection =
	timesStore.collection<LocalCountdownTimer>('countdownTimers');
export const worldClockCollection = timesStore.collection<LocalWorldClock>('worldClocks');
