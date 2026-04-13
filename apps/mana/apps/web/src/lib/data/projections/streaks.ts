/**
 * Streaks — Tracks consecutive-day activity across modules.
 *
 * Each streak definition queries a specific module to check if "today
 * counts" (e.g. water goal reached, at least 1 task completed, etc.).
 * The streak engine then looks backwards through the event store to
 * compute the current streak length.
 *
 * Status:
 *   active    — today or yesterday was active
 *   at_risk   — yesterday was NOT active, but the day before was
 *   broken    — more than 1 day gap
 */

import { db } from '../database';
import { decryptRecords } from '../crypto';
import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { DEFAULT_DAILY_GOAL_ML } from '$lib/modules/drink/types';
import type { LocalTask } from '$lib/modules/todo/types';
import type { LocalDrinkEntry } from '$lib/modules/drink/types';
import type { LocalMeal } from '$lib/modules/nutriphi/types';
import type { StreakInfo } from './types';

// ── Helpers ─────────────────────────────────────────

function dateStr(d: Date): string {
	return d.toISOString().split('T')[0];
}

function daysAgo(n: number): string {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return dateStr(d);
}

function daysBetween(a: string, b: string): number {
	const msPerDay = 86400000;
	return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

function streakStatus(lastActiveDate: string, today: string): StreakInfo['status'] {
	const gap = daysBetween(lastActiveDate, today);
	if (gap <= 0) return 'active'; // today
	if (gap === 1) return 'at_risk'; // yesterday
	return 'broken';
}

// ── Streak Definitions ──────────────────────────────

interface StreakDef {
	id: string;
	moduleId: string;
	label: string;
	/** Check if a given date "counts" as active. */
	checkDate: (date: string) => Promise<boolean>;
}

const streakDefs: StreakDef[] = [
	{
		id: 'streak-water-goal',
		moduleId: 'drink',
		label: 'Wasser-Ziel',
		async checkDate(date: string) {
			const entries = await db.table<LocalDrinkEntry>('drinkEntries').toArray();
			const dayEntries = entries.filter(
				(e) => !e.deletedAt && e.date === date && e.drinkType === 'water'
			);
			let totalMl = 0;
			for (const e of dayEntries) totalMl += e.quantityMl ?? 0;
			return totalMl >= DEFAULT_DAILY_GOAL_ML;
		},
	},
	{
		id: 'streak-tasks-completed',
		moduleId: 'todo',
		label: 'Tasks erledigt',
		async checkDate(date: string) {
			const tasks = await db.table<LocalTask>('tasks').toArray();
			return tasks.some(
				(t) =>
					!t.deletedAt &&
					t.isCompleted &&
					t.completedAt != null &&
					(t.completedAt as string).startsWith(date)
			);
		},
	},
	{
		id: 'streak-meals-logged',
		moduleId: 'nutriphi',
		label: 'Mahlzeiten getrackt',
		async checkDate(date: string) {
			const meals = await db.table<LocalMeal>('meals').toArray();
			return meals.some((m) => !m.deletedAt && m.date === date);
		},
	},
];

// ── Streak Calculator ───────────────────────────────

const MAX_LOOKBACK = 90; // days

async function computeStreak(def: StreakDef): Promise<StreakInfo> {
	const today = dateStr(new Date());
	let lastActiveDate = '';
	let currentStreak = 0;
	let longestStreak = 0;
	let runningStreak = 0;
	let streakBroken = false;

	for (let i = 0; i < MAX_LOOKBACK; i++) {
		const date = daysAgo(i);
		const active = await def.checkDate(date);

		if (active) {
			if (!lastActiveDate) lastActiveDate = date;
			if (!streakBroken) {
				currentStreak++;
			}
			runningStreak++;
		} else {
			if (!streakBroken && i > 0) {
				// First gap ends the current streak
				streakBroken = true;
			}
			if (runningStreak > longestStreak) longestStreak = runningStreak;
			runningStreak = 0;
		}
	}
	if (runningStreak > longestStreak) longestStreak = runningStreak;
	if (currentStreak > longestStreak) longestStreak = currentStreak;

	return {
		id: def.id,
		moduleId: def.moduleId,
		label: def.label,
		currentStreak,
		longestStreak,
		lastActiveDate: lastActiveDate || today,
		status: lastActiveDate ? streakStatus(lastActiveDate, today) : 'broken',
	};
}

async function buildAllStreaks(): Promise<StreakInfo[]> {
	return Promise.all(streakDefs.map(computeStreak));
}

/**
 * Reactive streak list — updates when underlying tables change.
 *
 * ```svelte
 * const streaks = useStreaks();
 * {#each streaks.value as s}
 *   <p>{s.label}: {s.currentStreak} Tage ({s.status})</p>
 * {/each}
 * ```
 */
export function useStreaks() {
	return useLiveQueryWithDefault<StreakInfo[]>(buildAllStreaks, []);
}
