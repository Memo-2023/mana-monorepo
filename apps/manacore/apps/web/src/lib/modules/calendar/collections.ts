/**
 * Calendar module — collection accessors and guest seed data.
 *
 * Events no longer store time fields directly — those live on TimeBlocks.
 * Guest seed creates both TimeBlock + LocalEvent pairs.
 */

import { db } from '$lib/data/database';
import type { LocalCalendar, LocalEvent } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const calendarTable = db.table<LocalCalendar>('calendars');
export const eventTable = db.table<LocalEvent>('events');

// ─── Guest Seed ────────────────────────────────────────────

const PERSONAL_CALENDAR_ID = 'personal-calendar';

export const CALENDAR_GUEST_SEED = {
	calendars: [
		{
			id: PERSONAL_CALENDAR_ID,
			name: 'Persönlich',
			color: '#3B82F6',
			isDefault: true,
			isVisible: true,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
	] satisfies LocalCalendar[],
	events: [
		{
			id: 'sample-event-1',
			calendarId: PERSONAL_CALENDAR_ID,
			timeBlockId: 'sample-tb-event-1',
			title: 'Willkommen bei Kalender!',
			description:
				'Dies ist ein Beispieltermin. Tippe darauf, um ihn zu bearbeiten oder zu löschen.',
			location: null,
			color: null,
			reminders: null,
		},
		{
			id: 'sample-event-2',
			calendarId: PERSONAL_CALENDAR_ID,
			timeBlockId: 'sample-tb-event-2',
			title: 'Mittagessen mit Freunden',
			description: null,
			location: 'Café am See',
			color: null,
			reminders: null,
		},
	] satisfies LocalEvent[],
};
