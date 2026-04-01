/**
 * Clock module types for the unified ManaCore app.
 */

import type { BaseRecord } from '@manacore/local-store';

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
