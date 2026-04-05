/**
 * Habits module types for the unified app.
 *
 * Habit = a trackable behavior (e.g. Coffee, Cigarette, Workout)
 * HabitLog = a single occurrence/tally with timestamp
 */

import type { BaseRecord } from '@manacore/local-store';

// ─── Local Record Types (Dexie) ───────────────────────────

export interface HabitSchedule {
	days: number[]; // 0=Sun, 1=Mon, ... 6=Sat
	time?: string; // HH:mm (optional, defaults to all-day)
}

export interface LocalHabit extends BaseRecord {
	title: string;
	icon: string;
	color: string;
	targetPerDay: number | null;
	defaultDuration?: number | null; // seconds (e.g., 300 for a 5min cigarette)
	schedule?: HabitSchedule | null; // optional recurring schedule
	order: number;
	isArchived: boolean;
}

export interface LocalHabitLog extends BaseRecord {
	habitId: string;
	timeBlockId: string;
	note: string | null;
}

// ─── Domain Types ─────────────────────────────────────────

export interface Habit {
	id: string;
	title: string;
	icon: string;
	color: string;
	targetPerDay: number | null;
	defaultDuration: number | null;
	schedule: HabitSchedule | null;
	order: number;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface HabitLog {
	id: string;
	habitId: string;
	timeBlockId: string;
	timestamp: string; // derived from timeBlock.startDate
	note: string | null;
	createdAt: string;
}

// ─── Constants ────────────────────────────────────────────

export const HABIT_COLORS: string[] = [
	'#ef4444',
	'#f97316',
	'#f59e0b',
	'#84cc16',
	'#22c55e',
	'#14b8a6',
	'#06b6d4',
	'#3b82f6',
	'#6366f1',
	'#8b5cf6',
	'#a855f7',
	'#d946ef',
	'#ec4899',
	'#f43f5e',
];

export const HABIT_ICONS: string[] = [
	'coffee',
	'drop',
	'barbell',
	'person-simple-run',
	'person-simple-walk',
	'person-simple-tai-chi',
	'bicycle',
	'book-open',
	'pencil-simple',
	'pill',
	'beer-stein',
	'pizza',
	'apple-logo',
	'music-note',
	'bed',
	'tooth',
	'shower',
	'cigarette',
	'heart',
	'brain',
	'star',
	'moon',
	'target',
	'fire',
];

/** Maps legacy emoji values to icon names for data migration. */
export const EMOJI_TO_ICON_MAP: Record<string, string> = {
	'\u2615': 'coffee',
	'\ud83d\udeb6': 'person-simple-walk',
	'\ud83c\udfc3': 'person-simple-run',
	'\ud83e\uddd8': 'person-simple-tai-chi',
	'\ud83d\udca7': 'drop',
	'\ud83c\udf4e': 'apple-logo',
	'\ud83d\udcda': 'book-open',
	'\ud83d\udcaa': 'barbell',
	'\ud83d\udecc': 'bed',
	'\ud83c\udfb5': 'music-note',
	'\ud83d\udc8a': 'pill',
	'\ud83c\udf7a': 'beer-stein',
	'\ud83c\udf55': 'pizza',
	'\ud83d\udeb4': 'bicycle',
	'\ud83d\udcdd': 'pencil-simple',
	'\ud83e\uddfc': 'tooth',
	'\u2b50': 'star',
	'\ud83d\ude2e\u200d\ud83d\udca8': 'wind',
};
