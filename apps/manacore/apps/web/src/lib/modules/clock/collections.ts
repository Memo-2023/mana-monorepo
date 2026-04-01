/**
 * Clock module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type { LocalAlarm, LocalTimer, LocalWorldClock } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const alarmTable = db.table<LocalAlarm>('alarms');
export const timerTable = db.table<LocalTimer>('timers');
export const worldClockTable = db.table<LocalWorldClock>('worldClocks');

// ─── Guest Seed ────────────────────────────────────────────

export const CLOCK_GUEST_SEED = {
	alarms: [
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
	] satisfies LocalAlarm[],
	worldClocks: [
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
	] satisfies LocalWorldClock[],
};
