/**
 * Reactive Queries & Pure Helpers for Periods module.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecord, decryptRecords } from '$lib/data/crypto';
import type {
	Period,
	PeriodDayLog,
	PeriodSymptom,
	LocalPeriod,
	LocalPeriodDayLog,
	LocalPeriodSymptom,
} from './types';

// ─── Type Converters ───────────────────────────────────────

export function toPeriod(local: LocalPeriod): Period {
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

export function toPeriodDayLog(local: LocalPeriodDayLog): PeriodDayLog {
	return {
		id: local.id,
		logDate: local.logDate,
		periodId: local.periodId,
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

export function toPeriodSymptom(local: LocalPeriodSymptom): PeriodSymptom {
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

export function useAllPeriods() {
	return useScopedLiveQuery(async () => {
		const visible = (
			await scopedForModule<LocalPeriod, string>('period', 'periods').toArray()
		).filter((c) => !c.deletedAt && !c.isArchived);
		const decrypted = await decryptRecords('periods', visible);
		return decrypted.map(toPeriod).sort((a, b) => b.startDate.localeCompare(a.startDate));
	}, [] as Period[]);
}

export function useCurrentPeriod() {
	return useScopedLiveQuery(
		async () => {
			const locals = await scopedForModule<LocalPeriod, string>('period', 'periods').toArray();
			const real = locals.filter((c) => !c.deletedAt && !c.isArchived && !c.isPredicted);
			if (real.length === 0) return null;
			const latest = real.sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
			const decrypted = await decryptRecord('periods', { ...latest });
			return toPeriod(decrypted);
		},
		null as Period | null
	);
}

export function useAllDayLogs() {
	return useScopedLiveQuery(async () => {
		const visible = (
			await scopedForModule<LocalPeriodDayLog, string>('period', 'periodDayLogs').toArray()
		).filter((l) => !l.deletedAt);
		const decrypted = await decryptRecords('periodDayLogs', visible);
		return decrypted.map(toPeriodDayLog).sort((a, b) => b.logDate.localeCompare(a.logDate));
	}, [] as PeriodDayLog[]);
}

export function useDayLog(date: string) {
	return useScopedLiveQuery(
		async () => {
			const locals = await db
				.table<LocalPeriodDayLog>('periodDayLogs')
				.where('logDate')
				.equals(date)
				.toArray();
			const active = locals.find((l) => !l.deletedAt);
			if (!active) return null;
			const decrypted = await decryptRecord('periodDayLogs', { ...active });
			return toPeriodDayLog(decrypted);
		},
		null as PeriodDayLog | null
	);
}

export function useAllSymptoms() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalPeriodSymptom, string>(
			'period',
			'periodSymptoms'
		).toArray();
		return locals
			.filter((s) => !s.deletedAt)
			.map(toPeriodSymptom)
			.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
	}, [] as PeriodSymptom[]);
}

// ─── Pure Helpers ──────────────────────────────────────────

/** Labels a caller must provide to formatLogDate so it can be locale-aware. */
export interface RelativeDateLabels {
	today: string;
	yesterday: string;
	/** Template for "N days ago", receives the numeric count. */
	daysAgo: (days: number) => string;
}

/** Group day logs by localized month label. */
export function groupLogsByMonth(
	logs: PeriodDayLog[],
	dateLocale: string = 'de-DE'
): Array<{ label: string; logs: PeriodDayLog[] }> {
	const groups = new Map<string, PeriodDayLog[]>();
	for (const l of logs) {
		const date = new Date(l.logDate);
		const label = date.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' });
		const bucket = groups.get(label) ?? [];
		bucket.push(l);
		groups.set(label, bucket);
	}
	return Array.from(groups, ([label, logs]) => ({ label, logs }));
}

/**
 * Format a log date relative to today using caller-provided labels.
 * Falls back to absolute date formatting via `dateLocale` when >= 7 days ago.
 */
export function formatLogDate(
	iso: string,
	labels: RelativeDateLabels,
	dateLocale: string = 'de-DE'
): string {
	const date = new Date(iso);
	const today = new Date();
	const diffDays = Math.floor((today.getTime() - date.getTime()) / 86_400_000);
	if (diffDays === 0) return labels.today;
	if (diffDays === 1) return labels.yesterday;
	if (diffDays < 7) return labels.daysAgo(diffDays);
	return date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
}
