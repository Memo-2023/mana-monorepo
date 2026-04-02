/**
 * Guest seed data for the Clock app.
 *
 * These records are loaded into IndexedDB when a new guest visits the app.
 * They provide sample alarms and world clocks to showcase the app.
 */

import type { LocalAlarm, LocalWorldClock } from './local-store';

export const guestAlarms: LocalAlarm[] = [
	{
		id: 'alarm-weekday-morning',
		label: 'Wecker Wochentags',
		time: '07:00',
		enabled: true,
		repeatDays: [1, 2, 3, 4, 5], // Mon-Fri
		snoozeMinutes: 5,
		sound: null,
		vibrate: true,
	},
];

export const guestWorldClocks: LocalWorldClock[] = [
	{
		id: 'wc-new-york',
		timezone: 'America/New_York',
		cityName: 'New York',
		sortOrder: 0,
	},
	{
		id: 'wc-tokyo',
		timezone: 'Asia/Tokyo',
		cityName: 'Tokio',
		sortOrder: 1,
	},
];
