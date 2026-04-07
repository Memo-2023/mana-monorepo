/**
 * Reactive Queries & Pure Helpers for Cycles module.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import type {
	Cycle,
	CycleDayLog,
	CycleSymptom,
	LocalCycle,
	LocalCycleDayLog,
	LocalCycleSymptom,
} from './types';

// ─── Type Converters ───────────────────────────────────────

export function toCycle(local: LocalCycle): Cycle {
	return {
		id: local.id,
		startDate: local.startDate,
		periodEndDate: local.periodEndDate,
		endDate: local.endDate,
		length: local.length,
		isPredicted: local.isPredicted,
		isArchived: local.isArchived,
		notes: local.notes,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toCycleDayLog(local: LocalCycleDayLog): CycleDayLog {
	return {
		id: local.id,
		logDate: local.logDate,
		cycleId: local.cycleId,
		flow: local.flow,
		mood: local.mood,
		energy: local.energy,
		temperature: local.temperature,
		cervicalMucus: local.cervicalMucus,
		symptoms: local.symptoms ?? [],
		sexualActivity: local.sexualActivity,
		notes: local.notes,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toCycleSymptom(local: LocalCycleSymptom): CycleSymptom {
	return {
		id: local.id,
		name: local.name,
		category: local.category,
		color: local.color,
		count: local.count ?? 0,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

export function useAllCycles() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalCycle>('cycles').toArray();
		return locals
			.filter((c) => !c.deletedAt && !c.isArchived)
			.map(toCycle)
			.sort((a, b) => b.startDate.localeCompare(a.startDate));
	}, [] as Cycle[]);
}

export function useCurrentCycle() {
	return useLiveQueryWithDefault(
		async () => {
			const locals = await db.table<LocalCycle>('cycles').toArray();
			const real = locals.filter((c) => !c.deletedAt && !c.isArchived && !c.isPredicted);
			if (real.length === 0) return null;
			const latest = real.sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
			return toCycle(latest);
		},
		null as Cycle | null
	);
}

export function useAllDayLogs() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalCycleDayLog>('cycleDayLogs').toArray();
		return locals
			.filter((l) => !l.deletedAt)
			.map(toCycleDayLog)
			.sort((a, b) => b.logDate.localeCompare(a.logDate));
	}, [] as CycleDayLog[]);
}

export function useDayLog(date: string) {
	return useLiveQueryWithDefault(
		async () => {
			const locals = await db
				.table<LocalCycleDayLog>('cycleDayLogs')
				.where('logDate')
				.equals(date)
				.toArray();
			const active = locals.find((l) => !l.deletedAt);
			return active ? toCycleDayLog(active) : null;
		},
		null as CycleDayLog | null
	);
}

export function useAllSymptoms() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalCycleSymptom>('cycleSymptoms').toArray();
		return locals
			.filter((s) => !s.deletedAt)
			.map(toCycleSymptom)
			.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
	}, [] as CycleSymptom[]);
}

// ─── Pure Helpers ──────────────────────────────────────────

/** Group day logs by ISO month label. */
export function groupLogsByMonth(
	logs: CycleDayLog[]
): Array<{ label: string; logs: CycleDayLog[] }> {
	const groups = new Map<string, CycleDayLog[]>();
	for (const l of logs) {
		const date = new Date(l.logDate);
		const label = date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
		const bucket = groups.get(label) ?? [];
		bucket.push(l);
		groups.set(label, bucket);
	}
	return Array.from(groups, ([label, logs]) => ({ label, logs }));
}

export function formatLogDate(iso: string): string {
	const date = new Date(iso);
	const today = new Date();
	const diffDays = Math.floor((today.getTime() - date.getTime()) / 86_400_000);
	if (diffDays === 0) return 'Heute';
	if (diffDays === 1) return 'Gestern';
	if (diffDays < 7) return `vor ${diffDays} Tagen`;
	return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
}
