/**
 * Guest seed data for the Calendar app.
 *
 * These records are loaded into IndexedDB when a new guest visits the app.
 * They provide a "Persoenlich" calendar with two sample events so the user
 * can immediately see how the app works.
 */

import type { LocalCalendar, LocalEvent } from './local-store';

const PERSONAL_CALENDAR_ID = 'personal-calendar';

export const guestCalendars: LocalCalendar[] = [
	{
		id: PERSONAL_CALENDAR_ID,
		name: 'Persönlich',
		color: '#3B82F6',
		isDefault: true,
		isVisible: true,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	},
];

const now = new Date();
const today10 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
const today11 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0);

const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrow14 = new Date(
	tomorrow.getFullYear(),
	tomorrow.getMonth(),
	tomorrow.getDate(),
	14,
	0,
	0
);
const tomorrow15 = new Date(
	tomorrow.getFullYear(),
	tomorrow.getMonth(),
	tomorrow.getDate(),
	15,
	30,
	0
);

export const guestEvents: LocalEvent[] = [
	{
		id: 'sample-event-1',
		calendarId: PERSONAL_CALENDAR_ID,
		title: 'Willkommen bei Kalender!',
		description: 'Dies ist ein Beispieltermin. Tippe darauf, um ihn zu bearbeiten oder zu löschen.',
		startDate: today10.toISOString(),
		endDate: today11.toISOString(),
		allDay: false,
		location: null,
		recurrenceRule: null,
		color: null,
		reminders: null,
	},
	{
		id: 'sample-event-2',
		calendarId: PERSONAL_CALENDAR_ID,
		title: 'Mittagessen mit Freunden',
		description: null,
		startDate: tomorrow14.toISOString(),
		endDate: tomorrow15.toISOString(),
		allDay: false,
		location: 'Café am See',
		recurrenceRule: null,
		color: null,
		reminders: null,
	},
];
