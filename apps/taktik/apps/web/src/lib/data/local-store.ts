/**
 * Taktik — Local-First Data Layer
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
} from './guest-seed';
import type { BillingRate, ProjectVisibility, EntrySourceRef } from '@taktik/shared';

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

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const taktikStore = createLocalStore({
	appId: 'taktik',
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
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const clientCollection = taktikStore.collection<LocalClient>('clients');
export const projectCollection = taktikStore.collection<LocalProject>('projects');
export const timeEntryCollection = taktikStore.collection<LocalTimeEntry>('timeEntries');
export const tagCollection = taktikStore.collection<LocalTag>('tags');
export const templateCollection = taktikStore.collection<LocalTemplate>('templates');
export const settingsCollection = taktikStore.collection<LocalSettings>('settings');
