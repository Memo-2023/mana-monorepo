/**
 * Habits module types for the unified app.
 *
 * Habit = a trackable behavior (e.g. Coffee, Cigarette, Workout)
 * HabitLog = a single occurrence/tally with timestamp
 */

import type { BaseRecord } from '@manacore/local-store';

// ─── Local Record Types (Dexie) ───────────────────────────

export interface LocalHabit extends BaseRecord {
	title: string;
	emoji: string;
	color: string;
	targetPerDay: number | null;
	order: number;
	isArchived: boolean;
}

export interface LocalHabitLog extends BaseRecord {
	habitId: string;
	timestamp: string; // ISO string
	note: string | null;
}

// ─── Domain Types ─────────────────────────────────────────

export interface Habit {
	id: string;
	title: string;
	emoji: string;
	color: string;
	targetPerDay: number | null;
	order: number;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface HabitLog {
	id: string;
	habitId: string;
	timestamp: string;
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

export const HABIT_EMOJIS: string[] = [
	'\u2615', // coffee
	'\ud83d\udeb6', // cigarette / walking
	'\ud83c\udfc3', // running
	'\ud83e\uddd8', // meditation
	'\ud83d\udca7', // water
	'\ud83c\udf4e', // apple / healthy food
	'\ud83d\udcda', // reading
	'\ud83d\udcaa', // workout
	'\ud83d\udecc', // sleep
	'\ud83c\udfb5', // music
	'\ud83d\udc8a', // pill / medicine
	'\ud83c\udf7a', // beer
	'\ud83c\udf55', // pizza / junk food
	'\ud83d\udeb4', // cycling
	'\ud83d\udcdd', // journal
	'\ud83e\uddfc', // teeth / hygiene
];
