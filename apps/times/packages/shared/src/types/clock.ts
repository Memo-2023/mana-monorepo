// ─── Alarm ──────────────────────────────────────────────

export interface Alarm {
	id: string;
	userId: string;
	label: string | null;
	time: string; // HH:mm format
	enabled: boolean;
	repeatDays: number[] | null; // [0-6] where 0 = Sunday
	snoozeMinutes: number | null;
	sound: string | null;
	vibrate: boolean | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateAlarmInput {
	label?: string;
	time: string;
	enabled?: boolean;
	repeatDays?: number[];
	snoozeMinutes?: number;
	sound?: string;
	vibrate?: boolean;
}

export interface UpdateAlarmInput {
	label?: string;
	time?: string;
	enabled?: boolean;
	repeatDays?: number[];
	snoozeMinutes?: number;
	sound?: string;
	vibrate?: boolean;
}

export type RepeatDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const REPEAT_DAY_LABELS = {
	0: 'Sun',
	1: 'Mon',
	2: 'Tue',
	3: 'Wed',
	4: 'Thu',
	5: 'Fri',
	6: 'Sat',
} as const;

export const REPEAT_DAY_LABELS_DE = {
	0: 'So',
	1: 'Mo',
	2: 'Di',
	3: 'Mi',
	4: 'Do',
	5: 'Fr',
	6: 'Sa',
} as const;

// ─── Countdown Timer ────────────────────────────────────

export type CountdownTimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface CountdownTimer {
	id: string;
	userId: string;
	label: string | null;
	durationSeconds: number;
	remainingSeconds: number | null;
	status: CountdownTimerStatus;
	startedAt: string | null;
	pausedAt: string | null;
	sound: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateCountdownTimerInput {
	label?: string;
	durationSeconds: number;
	sound?: string;
}

export interface UpdateCountdownTimerInput {
	label?: string;
	durationSeconds?: number;
	sound?: string;
}

export function formatCountdownDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function parseCountdownDuration(formatted: string): number {
	const parts = formatted.split(':').map(Number);
	if (parts.length === 3) {
		return parts[0] * 3600 + parts[1] * 60 + parts[2];
	}
	if (parts.length === 2) {
		return parts[0] * 60 + parts[1];
	}
	return parts[0];
}

// ─── World Clock ────────────────────────────────────────

export interface WorldClock {
	id: string;
	userId: string;
	timezone: string; // IANA timezone e.g. 'America/New_York'
	cityName: string;
	sortOrder: number;
	createdAt: string;
}

export interface CreateWorldClockInput {
	timezone: string;
	cityName: string;
}

export interface TimezoneInfo {
	timezone: string;
	city: string;
}

// ─── Preset ─────────────────────────────────────────────

export type PresetType = 'timer' | 'pomodoro';

export interface PresetSettings {
	workDuration?: number;
	breakDuration?: number;
	longBreakDuration?: number;
	sessionsBeforeLongBreak?: number;
	sound?: string;
}

export interface Preset {
	id: string;
	userId: string;
	type: PresetType;
	name: string;
	durationSeconds: number;
	settings: PresetSettings | null;
	createdAt: string;
}

export interface CreatePresetInput {
	type: PresetType;
	name: string;
	durationSeconds: number;
	settings?: PresetSettings;
}

export interface UpdatePresetInput {
	name?: string;
	durationSeconds?: number;
	settings?: PresetSettings;
}

export const DEFAULT_POMODORO_SETTINGS: PresetSettings = {
	workDuration: 25 * 60,
	breakDuration: 5 * 60,
	longBreakDuration: 15 * 60,
	sessionsBeforeLongBreak: 4,
};
