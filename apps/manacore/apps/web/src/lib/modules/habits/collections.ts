/**
 * Habits module — collection accessors and guest seed data.
 *
 * Tables are defined in the unified database.ts as:
 * habits, habitLogs
 */

import { db } from '$lib/data/database';
import type { LocalHabit, LocalHabitLog } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const habitTable = db.table<LocalHabit>('habits');
export const habitLogTable = db.table<LocalHabitLog>('habitLogs');

// ─── Guest Seed ────────────────────────────────────────────

export const HABITS_GUEST_SEED = {
	habits: [
		{
			id: 'habit-coffee',
			title: 'Kaffee',
			emoji: '\u2615',
			color: '#f59e0b',
			targetPerDay: 3,
			order: 0,
			isArchived: false,
		},
		{
			id: 'habit-water',
			title: 'Wasser',
			emoji: '\ud83d\udca7',
			color: '#06b6d4',
			targetPerDay: 8,
			order: 1,
			isArchived: false,
		},
		{
			id: 'habit-workout',
			title: 'Workout',
			emoji: '\ud83d\udcaa',
			color: '#22c55e',
			targetPerDay: 1,
			order: 2,
			isArchived: false,
		},
	] satisfies LocalHabit[],
	habitLogs: [] satisfies LocalHabitLog[],
};
