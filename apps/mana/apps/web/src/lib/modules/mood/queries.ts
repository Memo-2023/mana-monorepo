/**
 * Reactive Queries & Pure Helpers for the Mood module.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { decryptRecords } from '$lib/data/crypto';
import { db } from '$lib/data/database';
import { scopedForModule, applyVisibility } from '$lib/data/scope';
import type {
	LocalMoodEntry,
	LocalMoodSettings,
	MoodEntry,
	MoodSettings,
	CoreEmotion,
	ActivityContext,
} from './types';
import { DEFAULT_MOOD_SETTINGS, EMOTION_META } from './types';

// ─── Type Converters ────────────────────────────────────────

export function toMoodEntry(local: LocalMoodEntry): MoodEntry {
	return {
		id: local.id,
		date: local.date,
		time: local.time,
		level: local.level,
		emotion: local.emotion,
		secondaryEmotions: local.secondaryEmotions ?? [],
		activity: local.activity ?? null,
		withWhom: local.withWhom ?? '',
		notes: local.notes ?? '',
		tags: local.tags ?? [],
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

export function toMoodSettings(local: LocalMoodSettings): MoodSettings {
	return {
		id: local.id,
		dailyTarget: local.dailyTarget ?? DEFAULT_MOOD_SETTINGS.dailyTarget,
		reminderTimes: local.reminderTimes ?? DEFAULT_MOOD_SETTINGS.reminderTimes,
		remindersEnabled: local.remindersEnabled ?? DEFAULT_MOOD_SETTINGS.remindersEnabled,
	};
}

// ─── Live Queries ───────────────────────────────────────────

export function useAllMoodEntries() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalMoodEntry, string>('mood', 'moodEntries').toArray();
		const visible = applyVisibility(locals).filter((e) => !e.deletedAt);
		const decrypted = await decryptRecords('moodEntries', visible);
		return decrypted.map(toMoodEntry).sort((a, b) => {
			const cmp = b.date.localeCompare(a.date);
			return cmp !== 0 ? cmp : b.time.localeCompare(a.time);
		});
	}, [] as MoodEntry[]);
}

export function useMoodSettings() {
	return useScopedLiveQuery(
		async () => {
			const locals = await scopedForModule<LocalMoodSettings, string>(
				'mood',
				'moodSettings'
			).toArray();
			const row = applyVisibility(locals).find((s) => !s.deletedAt);
			return row ? toMoodSettings(row) : null;
		},
		null as MoodSettings | null
	);
}

// ─── Pure Helpers ───────────────────────────────────────────

export function todayDateStr(): string {
	return new Date().toISOString().split('T')[0];
}

/** Entries for a specific date. */
export function getEntriesForDate(entries: MoodEntry[], date: string): MoodEntry[] {
	return entries.filter((e) => e.date === date);
}

/** Today's entries. */
export function getTodayEntries(entries: MoodEntry[]): MoodEntry[] {
	return getEntriesForDate(entries, todayDateStr());
}

/** Average mood level for a date. */
export function getAvgLevelForDate(entries: MoodEntry[], date: string): number {
	const dayEntries = getEntriesForDate(entries, date);
	if (dayEntries.length === 0) return 0;
	return +(dayEntries.reduce((sum, e) => sum + e.level, 0) / dayEntries.length).toFixed(1);
}

/** Average mood level over the last N days (not entries). */
export function getAvgLevel(entries: MoodEntry[], days: number): number {
	const d = new Date();
	let total = 0;
	let count = 0;
	for (let i = 0; i < days; i++) {
		const dateStr = d.toISOString().split('T')[0];
		const avg = getAvgLevelForDate(entries, dateStr);
		if (avg > 0) {
			total += avg;
			count++;
		}
		d.setDate(d.getDate() - 1);
	}
	return count > 0 ? +(total / count).toFixed(1) : 0;
}

/** Most frequent emotion over the last N entries. */
export function getTopEmotion(entries: MoodEntry[], n: number): CoreEmotion | null {
	const slice = entries.slice(0, n);
	if (slice.length === 0) return null;
	const counts = new Map<CoreEmotion, number>();
	for (const e of slice) {
		counts.set(e.emotion, (counts.get(e.emotion) ?? 0) + 1);
	}
	let best: CoreEmotion | null = null;
	let bestCount = 0;
	for (const [emotion, count] of counts) {
		if (count > bestCount) {
			best = emotion;
			bestCount = count;
		}
	}
	return best;
}

/** Emotion frequency distribution over entries. */
export function getEmotionDistribution(
	entries: MoodEntry[]
): { emotion: CoreEmotion; count: number; pct: number }[] {
	if (entries.length === 0) return [];
	const counts = new Map<CoreEmotion, number>();
	for (const e of entries) {
		counts.set(e.emotion, (counts.get(e.emotion) ?? 0) + 1);
	}
	return [...counts.entries()]
		.map(([emotion, count]) => ({
			emotion,
			count,
			pct: Math.round((count / entries.length) * 100),
		}))
		.sort((a, b) => b.count - a.count);
}

/** Positive vs negative ratio. */
export function getValenceRatio(entries: MoodEntry[]): {
	positive: number;
	negative: number;
	neutral: number;
} {
	let positive = 0;
	let negative = 0;
	let neutral = 0;
	for (const e of entries) {
		const v = EMOTION_META[e.emotion]?.valence;
		if (v === 'positive') positive++;
		else if (v === 'negative') negative++;
		else neutral++;
	}
	const total = entries.length || 1;
	return {
		positive: Math.round((positive / total) * 100),
		negative: Math.round((negative / total) * 100),
		neutral: Math.round((neutral / total) * 100),
	};
}

/** Activity that correlates with highest/lowest mood. */
export function getActivityInsights(
	entries: MoodEntry[]
): { activity: ActivityContext; avgLevel: number; count: number }[] {
	const map = new Map<ActivityContext, { total: number; count: number }>();
	for (const e of entries) {
		if (!e.activity) continue;
		const existing = map.get(e.activity) ?? { total: 0, count: 0 };
		existing.total += e.level;
		existing.count++;
		map.set(e.activity, existing);
	}
	return [...map.entries()]
		.filter(([_, v]) => v.count >= 2)
		.map(([activity, v]) => ({
			activity,
			avgLevel: +(v.total / v.count).toFixed(1),
			count: v.count,
		}))
		.sort((a, b) => b.avgLevel - a.avgLevel);
}

/** Day-of-week patterns: average mood per weekday. */
export function getWeekdayPattern(
	entries: MoodEntry[]
): { day: number; label: string; avgLevel: number }[] {
	const labels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	const buckets = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }));

	for (const e of entries) {
		const dayIdx = new Date(e.date + 'T00:00').getDay();
		buckets[dayIdx].total += e.level;
		buckets[dayIdx].count++;
	}

	return buckets.map((b, i) => ({
		day: i,
		label: labels[i],
		avgLevel: b.count > 0 ? +(b.total / b.count).toFixed(1) : 0,
	}));
}

/** Time-of-day pattern: average mood per time bucket (morning/afternoon/evening/night). */
export function getTimeOfDayPattern(
	entries: MoodEntry[]
): { period: string; label: string; avgLevel: number; count: number }[] {
	const buckets: Record<string, { label: string; total: number; count: number }> = {
		morning: { label: 'Morgens (6–12)', total: 0, count: 0 },
		afternoon: { label: 'Nachmittags (12–17)', total: 0, count: 0 },
		evening: { label: 'Abends (17–22)', total: 0, count: 0 },
		night: { label: 'Nachts (22–6)', total: 0, count: 0 },
	};

	for (const e of entries) {
		const hour = parseInt(e.time.split(':')[0], 10);
		let period: string;
		if (hour >= 6 && hour < 12) period = 'morning';
		else if (hour >= 12 && hour < 17) period = 'afternoon';
		else if (hour >= 17 && hour < 22) period = 'evening';
		else period = 'night';
		buckets[period].total += e.level;
		buckets[period].count++;
	}

	return Object.entries(buckets).map(([period, b]) => ({
		period,
		label: b.label,
		avgLevel: b.count > 0 ? +(b.total / b.count).toFixed(1) : 0,
		count: b.count,
	}));
}

/** Week data: average mood level per day for the last 7 days. */
export function getWeekMoodData(
	entries: MoodEntry[]
): { date: string; dayLabel: string; avgLevel: number; count: number }[] {
	const now = new Date();
	const dayOfWeek = now.getDay();
	const monday = new Date(now);
	monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
	const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

	const result: { date: string; dayLabel: string; avgLevel: number; count: number }[] = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(monday);
		d.setDate(monday.getDate() + i);
		const dateStr = d.toISOString().split('T')[0];
		const dayEntries = getEntriesForDate(entries, dateStr);
		const avgLevel =
			dayEntries.length > 0
				? +(dayEntries.reduce((sum, e) => sum + e.level, 0) / dayEntries.length).toFixed(1)
				: 0;
		result.push({ date: dateStr, dayLabel: dayLabels[i], avgLevel, count: dayEntries.length });
	}
	return result;
}

/** Current logging streak (consecutive days with at least one entry). */
export function getCurrentStreak(entries: MoodEntry[]): number {
	if (entries.length === 0) return 0;
	const entryDays = new Set(entries.map((e) => e.date));
	let streak = 0;
	const d = new Date();
	const todayStr = d.toISOString().split('T')[0];
	if (!entryDays.has(todayStr)) d.setDate(d.getDate() - 1);
	while (true) {
		const dayStr = d.toISOString().split('T')[0];
		if (!entryDays.has(dayStr)) break;
		streak++;
		d.setDate(d.getDate() - 1);
	}
	return streak;
}

/** Effective settings. */
export function getEffectiveSettings(settings: MoodSettings | null): MoodSettings {
	if (settings) return settings;
	return { id: 'default', ...DEFAULT_MOOD_SETTINGS };
}
