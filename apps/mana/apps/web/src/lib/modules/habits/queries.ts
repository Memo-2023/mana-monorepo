/**
 * Reactive Queries & Pure Helpers for Habits module.
 *
 * Uses useLiveQueryWithDefault on the unified database.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type { LocalHabit, LocalHabitLog, Habit, HabitLog } from './types';
import type { LocalTimeBlock } from '$lib/data/time-blocks/types';

// ─── Type Converters ───────────────────────────────────────

export function toHabit(local: LocalHabit): Habit {
	return {
		id: local.id,
		title: local.title,
		icon: local.icon ?? 'star',
		color: local.color,
		targetPerDay: local.targetPerDay,
		defaultDuration: local.defaultDuration ?? null,
		schedule: local.schedule ?? null,
		order: local.order,
		isArchived: local.isArchived,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Convert LocalHabitLog + its TimeBlock into a domain HabitLog. */
export function toHabitLog(local: LocalHabitLog, block?: LocalTimeBlock | null): HabitLog {
	const now = new Date().toISOString();
	return {
		id: local.id,
		habitId: local.habitId,
		timeBlockId: local.timeBlockId,
		timestamp: block?.startDate ?? local.createdAt ?? now,
		note: local.note,
		createdAt: local.createdAt ?? now,
	};
}

// ─── Live Queries ──────────────────────────────────────────

export function useAllHabits() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalHabit, string>('habits', 'habits').sortBy('order');
		return locals.filter((h) => !h.deletedAt).map(toHabit);
	}, [] as Habit[]);
}

export function useAllHabitLogs() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalHabitLog, string>('habits', 'habitLogs').toArray();
		const active = locals.filter((l) => !l.deletedAt);

		// Batch-fetch all related timeBlocks
		const blockIds = active.map((l) => l.timeBlockId).filter(Boolean);
		const blocks =
			blockIds.length > 0
				? await db.table<LocalTimeBlock>('timeBlocks').where('id').anyOf(blockIds).toArray()
				: [];
		const blocksById = new Map(blocks.map((b) => [b.id, b]));

		return active.map((l) => toHabitLog(l, blocksById.get(l.timeBlockId)));
	}, [] as HabitLog[]);
}

export function useHabitLogsForHabit(habitId: string) {
	return useLiveQueryWithDefault(async () => {
		const locals = await db
			.table<LocalHabitLog>('habitLogs')
			.where('habitId')
			.equals(habitId)
			.toArray();
		const active = locals.filter((l) => !l.deletedAt);

		const blockIds = active.map((l) => l.timeBlockId).filter(Boolean);
		const blocks =
			blockIds.length > 0
				? await db.table<LocalTimeBlock>('timeBlocks').where('id').anyOf(blockIds).toArray()
				: [];
		const blocksById = new Map(blocks.map((b) => [b.id, b]));

		return active
			.map((l) => toHabitLog(l, blocksById.get(l.timeBlockId)))
			.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
	}, [] as HabitLog[]);
}

// ─── Pure Helpers ──────────────────────────────────────────

/** Get today's date string (YYYY-MM-DD) */
export function todayStr(): string {
	return new Date().toISOString().split('T')[0];
}

/** Filter logs for a specific date */
export function getLogsForDate(logs: HabitLog[], date: string): HabitLog[] {
	return logs.filter((l) => l.timestamp.startsWith(date));
}

/** Count logs for a specific habit on a given date */
export function getCountForDate(logs: HabitLog[], habitId: string, date: string): number {
	return logs.filter((l) => l.habitId === habitId && l.timestamp.startsWith(date)).length;
}

/** Get active (non-archived) habits */
export function getActiveHabits(habits: Habit[]): Habit[] {
	return habits.filter((h) => !h.isArchived).sort((a, b) => a.order - b.order);
}

/** Get today's count per habit */
export function getTodayCounts(habits: Habit[], logs: HabitLog[]): Map<string, number> {
	const today = todayStr();
	const counts = new Map<string, number>();
	for (const h of habits) {
		counts.set(h.id, getCountForDate(logs, h.id, today));
	}
	return counts;
}

/** Calculate streak (consecutive days with at least one log) */
export function getStreak(logs: HabitLog[], habitId: string): number {
	const habitLogs = logs.filter((l) => l.habitId === habitId);
	if (habitLogs.length === 0) return 0;

	const dates = new Set(habitLogs.map((l) => l.timestamp.split('T')[0]));
	let streak = 0;
	const d = new Date();

	while (true) {
		const dateStr = d.toISOString().split('T')[0];
		if (dates.has(dateStr)) {
			streak++;
			d.setDate(d.getDate() - 1);
		} else {
			break;
		}
	}

	return streak;
}

/** Group logs by date (most recent first) */
export function groupLogsByDate(logs: HabitLog[]): Map<string, HabitLog[]> {
	const groups = new Map<string, HabitLog[]>();
	const sorted = [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
	for (const log of sorted) {
		const date = log.timestamp.split('T')[0];
		const existing = groups.get(date) || [];
		existing.push(log);
		groups.set(date, existing);
	}
	return groups;
}

/** Format time from ISO string to HH:MM */
export function formatTime(iso: string): string {
	const d = new Date(iso);
	return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
