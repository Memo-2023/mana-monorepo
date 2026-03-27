/**
 * Calendar App — Local-First Data Layer
 *
 * Defines the IndexedDB database, collections, and guest seed data.
 * This is the single source of truth for all Calendar data.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestCalendars, guestEvents } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalCalendar extends BaseRecord {
	name: string;
	color: string;
	isDefault: boolean;
	isVisible: boolean;
	timezone: string;
}

export interface LocalEvent extends BaseRecord {
	calendarId: string;
	title: string;
	description?: string | null;
	startDate: string;
	endDate: string;
	allDay: boolean;
	location?: string | null;
	recurrenceRule?: string | null;
	color?: string | null;
	reminders?: unknown | null;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const calendarStore = createLocalStore({
	appId: 'calendar',
	collections: [
		{
			name: 'calendars',
			indexes: ['isDefault', 'isVisible'],
			guestSeed: guestCalendars,
		},
		{
			name: 'events',
			indexes: ['calendarId', 'startDate', 'endDate', 'allDay', '[calendarId+startDate]'],
			guestSeed: guestEvents,
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const calendarCollection = calendarStore.collection<LocalCalendar>('calendars');
export const eventCollection = calendarStore.collection<LocalEvent>('events');
