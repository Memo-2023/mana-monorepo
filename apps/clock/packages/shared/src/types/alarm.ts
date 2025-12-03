export interface Alarm {
	id: string;
	userId: string;
	label: string | null;
	time: string; // HH:MM:SS format
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
