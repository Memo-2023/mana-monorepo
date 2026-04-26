/**
 * Reactive Queries & Pure Helpers for the Sleep module.
 *
 * Read-side only — mutations live in stores/sleep.svelte.ts.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { deriveUpdatedAt } from '$lib/data/sync';
import { decryptRecords } from '$lib/data/crypto';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type {
	LocalSleepEntry,
	LocalSleepHygieneLog,
	LocalSleepHygieneCheck,
	LocalSleepSettings,
	SleepEntry,
	SleepHygieneLog,
	SleepHygieneCheck,
	SleepSettings,
} from './types';
import { DEFAULT_SLEEP_SETTINGS } from './types';

// ─── Type Converters ────────────────────────────────────────

export function toSleepEntry(local: LocalSleepEntry): SleepEntry {
	const now = new Date().toISOString();
	return {
		id: local.id,
		date: local.date,
		bedtime: local.bedtime,
		wakeTime: local.wakeTime,
		durationMin: local.durationMin,
		sleepLatencyMin: local.sleepLatencyMin ?? null,
		interruptions: local.interruptions ?? 0,
		interruptionDurationMin: local.interruptionDurationMin ?? 0,
		quality: local.quality,
		restedness: local.restedness ?? null,
		notes: local.notes ?? '',
		tags: local.tags ?? [],
		dreamIds: local.dreamIds ?? [],
		createdAt: local.createdAt ?? now,
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toSleepHygieneLog(local: LocalSleepHygieneLog): SleepHygieneLog {
	return {
		id: local.id,
		date: local.date,
		completedCheckIds: local.completedCheckIds ?? [],
		score: local.score,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

export function toSleepHygieneCheck(local: LocalSleepHygieneCheck): SleepHygieneCheck {
	const now = new Date().toISOString();
	return {
		id: local.id,
		name: local.name,
		description: local.description ?? '',
		category: local.category,
		isActive: local.isActive,
		isPreset: local.isPreset,
		order: local.order,
		createdAt: local.createdAt ?? now,
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toSleepSettings(local: LocalSleepSettings): SleepSettings {
	return {
		id: local.id,
		goalMin: local.goalMin ?? DEFAULT_SLEEP_SETTINGS.goalMin,
		targetBedtime: local.targetBedtime ?? DEFAULT_SLEEP_SETTINGS.targetBedtime,
		targetWakeTime: local.targetWakeTime ?? DEFAULT_SLEEP_SETTINGS.targetWakeTime,
		bedtimeReminderMin: local.bedtimeReminderMin ?? DEFAULT_SLEEP_SETTINGS.bedtimeReminderMin,
		morningReminderEnabled:
			local.morningReminderEnabled ?? DEFAULT_SLEEP_SETTINGS.morningReminderEnabled,
		morningReminderTime: local.morningReminderTime ?? DEFAULT_SLEEP_SETTINGS.morningReminderTime,
	};
}

// ─── Live Queries ───────────────────────────────────────────

export function useAllSleepEntries() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalSleepEntry, string>(
			'sleep',
			'sleepEntries'
		).toArray();
		const visible = locals.filter((e) => !e.deletedAt);
		const decrypted = await decryptRecords('sleepEntries', visible);
		return decrypted.map(toSleepEntry).sort((a, b) => b.date.localeCompare(a.date));
	}, [] as SleepEntry[]);
}

export function useAllSleepHygieneLogs() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalSleepHygieneLog, string>(
			'sleep',
			'sleepHygieneLogs'
		).toArray();
		const visible = locals.filter((l) => !l.deletedAt);
		return visible.map(toSleepHygieneLog).sort((a, b) => b.date.localeCompare(a.date));
	}, [] as SleepHygieneLog[]);
}

export function useAllSleepHygieneChecks() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalSleepHygieneCheck, string>(
			'sleep',
			'sleepHygieneChecks'
		).toArray();
		const visible = locals.filter((c) => !c.deletedAt);
		const decrypted = await decryptRecords('sleepHygieneChecks', visible);
		return decrypted.map(toSleepHygieneCheck).sort((a, b) => a.order - b.order);
	}, [] as SleepHygieneCheck[]);
}

export function useSleepSettings() {
	return useScopedLiveQuery(
		async () => {
			const locals = await scopedForModule<LocalSleepSettings, string>(
				'sleep',
				'sleepSettings'
			).toArray();
			const row = locals.find((s) => !s.deletedAt);
			return row ? toSleepSettings(row) : null;
		},
		null as SleepSettings | null
	);
}

// ─── Pure Helpers ───────────────────────────────────────────

/** Today as YYYY-MM-DD. */
export function todayDateStr(): string {
	return new Date().toISOString().split('T')[0];
}

/** Yesterday as YYYY-MM-DD. */
export function yesterdayDateStr(): string {
	const d = new Date();
	d.setDate(d.getDate() - 1);
	return d.toISOString().split('T')[0];
}

/** Calculate sleep duration in minutes from bedtime to wake time (handles midnight crossing). */
export function calcDurationMin(bedtime: string, wakeTime: string): number {
	const bed = new Date(bedtime).getTime();
	const wake = new Date(wakeTime).getTime();
	if (wake <= bed) return 0;
	return Math.round((wake - bed) / 60000);
}

/** Format minutes as "Xh Ymin". */
export function formatDuration(min: number): string {
	const h = Math.floor(min / 60);
	const m = min % 60;
	if (h === 0) return `${m} Min`;
	if (m === 0) return `${h}h`;
	return `${h}h ${m}min`;
}

/** Format HH:mm from ISO datetime. */
export function formatTime(iso: string): string {
	return iso.split('T')[1]?.slice(0, 5) ?? '';
}

/** Last night's entry (date = yesterday or today depending on when logged). */
export function getLastNight(entries: SleepEntry[]): SleepEntry | null {
	const today = todayDateStr();
	const yesterday = yesterdayDateStr();
	return entries.find((e) => e.date === today || e.date === yesterday) ?? entries[0] ?? null;
}

/** Entry for a specific date. */
export function getEntryForDate(entries: SleepEntry[], date: string): SleepEntry | null {
	return entries.find((e) => e.date === date) ?? null;
}

/** Has the user logged last night's sleep? */
export function hasLoggedToday(entries: SleepEntry[]): boolean {
	const today = todayDateStr();
	const yesterday = yesterdayDateStr();
	return entries.some((e) => e.date === today || e.date === yesterday);
}

/** Average sleep duration over the last N entries. */
export function getAvgDuration(entries: SleepEntry[], n: number): number {
	const slice = entries.slice(0, n);
	if (slice.length === 0) return 0;
	return Math.round(slice.reduce((sum, e) => sum + e.durationMin, 0) / slice.length);
}

/** Average quality over the last N entries. */
export function getAvgQuality(entries: SleepEntry[], n: number): number {
	const slice = entries.slice(0, n);
	if (slice.length === 0) return 0;
	return +(slice.reduce((sum, e) => sum + e.quality, 0) / slice.length).toFixed(1);
}

/** Sleep debt for current week (Mon–Sun). Positive = deficit, negative = surplus. */
export function getWeekSleepDebt(entries: SleepEntry[], goalMin: number): number {
	const now = new Date();
	const dayOfWeek = now.getDay();
	const monday = new Date(now);
	monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
	monday.setHours(0, 0, 0, 0);
	const mondayStr = monday.toISOString().split('T')[0];

	let debt = 0;
	const d = new Date(monday);
	const todayStr = todayDateStr();

	while (d.toISOString().split('T')[0] <= todayStr) {
		const dateStr = d.toISOString().split('T')[0];
		const entry = entries.find((e) => e.date === dateStr);
		debt += goalMin - (entry?.durationMin ?? 0);
		d.setDate(d.getDate() + 1);
	}

	return debt;
}

/**
 * Consistency score 0–100.
 * Based on standard deviation of bedtime/wake time across last N entries.
 * Lower deviation = higher score.
 */
export function getConsistencyScore(entries: SleepEntry[], n: number): number {
	const slice = entries.slice(0, n);
	if (slice.length < 3) return 0;

	// Extract bedtime minutes-from-midnight (with midnight crossing: 23:00 = -60, 01:00 = 60)
	const bedMinutes = slice.map((e) => {
		const d = new Date(e.bedtime);
		let mins = d.getHours() * 60 + d.getMinutes();
		if (mins > 720) mins -= 1440; // Normalize past-midnight bedtimes
		return mins;
	});

	const wakeMinutes = slice.map((e) => {
		const d = new Date(e.wakeTime);
		return d.getHours() * 60 + d.getMinutes();
	});

	const stddev = (arr: number[]): number => {
		const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
		const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
		return Math.sqrt(variance);
	};

	const bedStd = stddev(bedMinutes);
	const wakeStd = stddev(wakeMinutes);

	// Score: 100 at 0 deviation, drops ~50pts per 30min stddev
	const score = Math.max(0, Math.min(100, 100 - (bedStd / 30) * 25 - (wakeStd / 30) * 25));
	return Math.round(score);
}

/** Current streak: consecutive days with a sleep entry. */
export function getCurrentStreak(entries: SleepEntry[]): number {
	if (entries.length === 0) return 0;

	const entryDays = new Set(entries.map((e) => e.date));
	let streak = 0;
	const d = new Date();

	const todayStr = d.toISOString().split('T')[0];
	if (!entryDays.has(todayStr)) {
		d.setDate(d.getDate() - 1);
	}

	while (true) {
		const dayStr = d.toISOString().split('T')[0];
		if (!entryDays.has(dayStr)) break;
		streak++;
		d.setDate(d.getDate() - 1);
	}

	return streak;
}

/** Week data: one entry per day (Mon–Sun) with duration + quality. */
export function getWeekData(
	entries: SleepEntry[]
): { date: string; dayLabel: string; durationMin: number; quality: number }[] {
	const now = new Date();
	const dayOfWeek = now.getDay();
	const monday = new Date(now);
	monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));

	const result: { date: string; dayLabel: string; durationMin: number; quality: number }[] = [];
	const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

	for (let i = 0; i < 7; i++) {
		const d = new Date(monday);
		d.setDate(monday.getDate() + i);
		const dateStr = d.toISOString().split('T')[0];
		const entry = entries.find((e) => e.date === dateStr);
		result.push({
			date: dateStr,
			dayLabel: dayLabels[i],
			durationMin: entry?.durationMin ?? 0,
			quality: entry?.quality ?? 0,
		});
	}

	return result;
}

/** Quality data for the last 30 days (for heatmap). */
export function getQualityHeatmap(
	entries: SleepEntry[],
	days: number
): { date: string; quality: number }[] {
	const result: { date: string; quality: number }[] = [];
	const d = new Date();

	for (let i = 0; i < days; i++) {
		const dateStr = d.toISOString().split('T')[0];
		const entry = entries.find((e) => e.date === dateStr);
		result.unshift({ date: dateStr, quality: entry?.quality ?? 0 });
		d.setDate(d.getDate() - 1);
	}

	return result;
}

/** Correlation between hygiene score and sleep quality (simple average comparison). */
export function getHygieneCorrelation(
	entries: SleepEntry[],
	hygieneLogs: SleepHygieneLog[]
): { withHygiene: number; withoutHygiene: number } | null {
	const logsMap = new Map(hygieneLogs.map((l) => [l.date, l]));
	const withH: number[] = [];
	const withoutH: number[] = [];

	for (const entry of entries) {
		const log = logsMap.get(entry.date);
		if (log && log.score >= 70) {
			withH.push(entry.quality);
		} else {
			withoutH.push(entry.quality);
		}
	}

	if (withH.length < 3 || withoutH.length < 3) return null;

	return {
		withHygiene: +(withH.reduce((a, b) => a + b, 0) / withH.length).toFixed(1),
		withoutHygiene: +(withoutH.reduce((a, b) => a + b, 0) / withoutH.length).toFixed(1),
	};
}

/** Effective settings (DB row or defaults). */
export function getEffectiveSettings(settings: SleepSettings | null): SleepSettings {
	if (settings) return settings;
	return {
		id: 'default',
		...DEFAULT_SLEEP_SETTINGS,
	};
}
