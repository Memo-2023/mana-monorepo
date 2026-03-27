/**
 * Clock App — Local-First Data Layer
 *
 * Defines the IndexedDB database, collections, and guest seed data.
 * This is the single source of truth for all Clock data.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestAlarms, guestWorldClocks } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalAlarm extends BaseRecord {
	label: string | null;
	time: string; // HH:mm format
	enabled: boolean;
	repeatDays: number[] | null; // [0-6] where 0 = Sunday
	snoozeMinutes: number | null;
	sound: string | null;
	vibrate: boolean | null;
}

export interface LocalTimer extends BaseRecord {
	label: string | null;
	durationSeconds: number;
	remainingSeconds: number | null;
	status: 'idle' | 'running' | 'paused' | 'finished';
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

export const clockStore = createLocalStore({
	appId: 'clock',
	collections: [
		{
			name: 'alarms',
			indexes: ['enabled', 'time'],
			guestSeed: guestAlarms,
		},
		{
			name: 'timers',
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
export const alarmCollection = clockStore.collection<LocalAlarm>('alarms');
export const timerCollection = clockStore.collection<LocalTimer>('timers');
export const worldClockCollection = clockStore.collection<LocalWorldClock>('worldClocks');
