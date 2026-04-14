/**
 * Streaks — Event-driven consecutive-day tracking.
 *
 * Persistent state in `_streakState` table. Updated incrementally
 * via event bus subscription instead of scanning 90 days of history.
 *
 * On relevant events (DrinkLogged, TaskCompleted, MealLogged, etc.),
 * the streak for today is marked active. On each read, we check if
 * the streak is still consecutive or has been broken.
 *
 * Status:
 *   active   — today is active
 *   at_risk  — today not yet active, but yesterday was
 *   broken   — gap > 1 day
 */

import { db } from '../database';
import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { eventBus } from '../events/event-bus';
import type { DomainEvent } from '../events/types';
import type { StreakInfo } from './types';

// ── Persistent State ────────────────────────────────

interface StreakState {
	id: string;
	label: string;
	moduleId: string;
	currentStreak: number;
	longestStreak: number;
	lastActiveDate: string; // YYYY-MM-DD
}

const TABLE = '_streakState';

function todayStr(): string {
	return new Date().toISOString().split('T')[0];
}

function yesterdayStr(): string {
	const d = new Date();
	d.setDate(d.getDate() - 1);
	return d.toISOString().split('T')[0];
}

// ── Streak Definitions ──────────────────────────────

interface StreakDef {
	id: string;
	moduleId: string;
	label: string;
	/** Domain event types that count as "active" for this streak */
	triggerEvents: string[];
	/** Optional: only count events where this payload filter matches */
	filter?: (payload: Record<string, unknown>) => boolean;
}

const STREAK_DEFS: StreakDef[] = [
	{
		id: 'streak-water-goal',
		moduleId: 'drink',
		label: 'Wasser-Ziel',
		triggerEvents: ['DrinkLogged'],
		filter: (p) => p.drinkType === 'water',
	},
	{
		id: 'streak-tasks-completed',
		moduleId: 'todo',
		label: 'Tasks erledigt',
		triggerEvents: ['TaskCompleted'],
	},
	{
		id: 'streak-meals-logged',
		moduleId: 'food',
		label: 'Mahlzeiten getrackt',
		triggerEvents: ['MealLogged', 'MealFromPhotoLogged'],
	},
	{
		id: 'streak-workout',
		moduleId: 'body',
		label: 'Workout',
		triggerEvents: ['WorkoutFinished'],
	},
	{
		id: 'streak-journal',
		moduleId: 'journal',
		label: 'Journal',
		triggerEvents: ['JournalEntryCreated'],
	},
	{
		id: 'streak-meditation',
		moduleId: 'meditate',
		label: 'Meditation',
		triggerEvents: ['MeditationCompleted'],
	},
];

// ── Core Logic ──────────────────────────────────────

async function markActive(streakId: string): Promise<void> {
	const today = todayStr();
	const existing = await db.table<StreakState>(TABLE).get(streakId);

	if (!existing) {
		// First ever activation — seed from definition
		const def = STREAK_DEFS.find((d) => d.id === streakId);
		if (!def) return;
		try {
			await db.table(TABLE).add({
				id: streakId,
				label: def.label,
				moduleId: def.moduleId,
				currentStreak: 1,
				longestStreak: 1,
				lastActiveDate: today,
			});
		} catch {
			// Race condition: another event already seeded this streak
		}
		return;
	}

	if (existing.lastActiveDate === today) return; // Already active today

	const yesterday = yesterdayStr();
	const isConsecutive = existing.lastActiveDate === yesterday;
	const newStreak = isConsecutive ? existing.currentStreak + 1 : 1;
	const newLongest = Math.max(existing.longestStreak, newStreak);

	await db.table(TABLE).update(streakId, {
		currentStreak: newStreak,
		longestStreak: newLongest,
		lastActiveDate: today,
	});
}

function computeStatus(state: StreakState): StreakInfo['status'] {
	const today = todayStr();
	if (state.lastActiveDate === today) return 'active';
	if (state.lastActiveDate === yesterdayStr()) return 'at_risk';
	return 'broken';
}

// ── Event Bus Subscription ──────────────────────────

let unsubscribe: (() => void) | null = null;

export function startStreakTracker(): void {
	if (unsubscribe) return;

	unsubscribe = eventBus.onAny((event: DomainEvent) => {
		for (const def of STREAK_DEFS) {
			if (!def.triggerEvents.includes(event.type)) continue;
			if (def.filter && !def.filter(event.payload as Record<string, unknown>)) continue;
			markActive(def.id);
		}
	});
}

export function stopStreakTracker(): void {
	unsubscribe?.();
	unsubscribe = null;
}

// ── Seed defaults ───────────────────────────────────

async function ensureSeeded(): Promise<void> {
	const count = await db.table(TABLE).count();
	if (count > 0) return;
	// Seed empty states so useStreaks() returns all definitions
	for (const def of STREAK_DEFS) {
		await db.table(TABLE).add({
			id: def.id,
			label: def.label,
			moduleId: def.moduleId,
			currentStreak: 0,
			longestStreak: 0,
			lastActiveDate: '',
		});
	}
}

// ── Read API ────────────────────────────────────────

async function buildAllStreaks(): Promise<StreakInfo[]> {
	await ensureSeeded();
	const states = await db.table<StreakState>(TABLE).toArray();

	return states.map((s) => ({
		id: s.id,
		moduleId: s.moduleId,
		label: s.label,
		currentStreak:
			s.lastActiveDate === todayStr() || s.lastActiveDate === yesterdayStr() ? s.currentStreak : 0, // Reset display if broken
		longestStreak: s.longestStreak,
		lastActiveDate: s.lastActiveDate || todayStr(),
		status: s.lastActiveDate ? computeStatus(s) : 'broken',
	}));
}

/**
 * Reactive streak list. Reads from `_streakState` table (fast, no scanning).
 */
export function useStreaks() {
	return useLiveQueryWithDefault<StreakInfo[]>(buildAllStreaks, []);
}
