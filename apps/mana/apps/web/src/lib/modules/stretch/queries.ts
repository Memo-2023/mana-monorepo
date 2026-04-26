/**
 * Reactive Queries & Pure Helpers for the Stretch module.
 *
 * Read-side only — mutations live in stores/stretch.svelte.ts.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { deriveUpdatedAt } from '$lib/data/sync';
import { decryptRecords } from '$lib/data/crypto';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type {
	LocalStretchExercise,
	LocalStretchRoutine,
	LocalStretchSession,
	LocalStretchAssessment,
	LocalStretchReminder,
	StretchExercise,
	StretchRoutine,
	StretchSession,
	StretchAssessment,
	StretchReminder,
	BodyRegion,
} from './types';

// ─── Type Converters ────────────────────────────────────────

export function toStretchExercise(local: LocalStretchExercise): StretchExercise {
	const now = new Date().toISOString();
	return {
		id: local.id,
		name: local.name,
		description: local.description ?? '',
		bodyRegion: local.bodyRegion,
		difficulty: local.difficulty,
		defaultDurationSec: local.defaultDurationSec,
		bilateral: local.bilateral,
		tags: local.tags ?? [],
		isPreset: local.isPreset,
		isArchived: local.isArchived,
		order: local.order,
		createdAt: local.createdAt ?? now,
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toStretchRoutine(local: LocalStretchRoutine): StretchRoutine {
	const now = new Date().toISOString();
	return {
		id: local.id,
		name: local.name,
		description: local.description ?? '',
		routineType: local.routineType,
		targetBodyRegions: local.targetBodyRegions ?? [],
		exercises: local.exercises ?? [],
		estimatedDurationMin: local.estimatedDurationMin,
		isPreset: local.isPreset,
		isCustom: local.isCustom,
		isPinned: local.isPinned,
		order: local.order,
		createdAt: local.createdAt ?? now,
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toStretchSession(local: LocalStretchSession): StretchSession {
	return {
		id: local.id,
		routineId: local.routineId ?? null,
		routineName: local.routineName ?? '',
		startedAt: local.startedAt,
		endedAt: local.endedAt ?? null,
		totalDurationSec: local.totalDurationSec,
		completedExercises: local.completedExercises,
		totalExercises: local.totalExercises,
		skippedExerciseIds: local.skippedExerciseIds ?? [],
		mood: local.mood ?? null,
		notes: local.notes ?? '',
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

export function toStretchAssessment(local: LocalStretchAssessment): StretchAssessment {
	return {
		id: local.id,
		assessedAt: local.assessedAt,
		tests: local.tests ?? [],
		overallScore: local.overallScore,
		painRegions: local.painRegions ?? [],
		notes: local.notes ?? '',
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

export function toStretchReminder(local: LocalStretchReminder): StretchReminder {
	const now = new Date().toISOString();
	return {
		id: local.id,
		name: local.name,
		routineId: local.routineId ?? null,
		time: local.time,
		days: local.days ?? [],
		isActive: local.isActive,
		lastTriggeredAt: local.lastTriggeredAt ?? null,
		createdAt: local.createdAt ?? now,
		updatedAt: deriveUpdatedAt(local),
	};
}

// ─── Live Queries ───────────────────────────────────────────

export function useAllStretchExercises() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalStretchExercise, string>(
			'stretch',
			'stretchExercises'
		).toArray();
		const visible = locals.filter((e) => !e.deletedAt);
		const decrypted = await decryptRecords('stretchExercises', visible);
		return decrypted.map(toStretchExercise).sort((a, b) => a.order - b.order);
	}, [] as StretchExercise[]);
}

export function useAllStretchRoutines() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalStretchRoutine, string>(
			'stretch',
			'stretchRoutines'
		).toArray();
		const visible = locals.filter((r) => !r.deletedAt);
		const decrypted = await decryptRecords('stretchRoutines', visible);
		return decrypted.map(toStretchRoutine).sort((a, b) => a.order - b.order);
	}, [] as StretchRoutine[]);
}

export function useAllStretchSessions() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalStretchSession, string>(
			'stretch',
			'stretchSessions'
		).toArray();
		const visible = locals.filter((s) => !s.deletedAt);
		const decrypted = await decryptRecords('stretchSessions', visible);
		return decrypted.map(toStretchSession).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
	}, [] as StretchSession[]);
}

export function useAllStretchAssessments() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalStretchAssessment, string>(
			'stretch',
			'stretchAssessments'
		).toArray();
		const visible = locals.filter((a) => !a.deletedAt);
		const decrypted = await decryptRecords('stretchAssessments', visible);
		return decrypted
			.map(toStretchAssessment)
			.sort((a, b) => b.assessedAt.localeCompare(a.assessedAt));
	}, [] as StretchAssessment[]);
}

export function useAllStretchReminders() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalStretchReminder, string>(
			'stretch',
			'stretchReminders'
		).toArray();
		const visible = locals.filter((r) => !r.deletedAt);
		const decrypted = await decryptRecords('stretchReminders', visible);
		return decrypted.map(toStretchReminder);
	}, [] as StretchReminder[]);
}

// ─── Pure Helpers ───────────────────────────────────────────

/** Today as YYYY-MM-DD. */
export function todayDateStr(): string {
	return new Date().toISOString().split('T')[0];
}

/** Sessions from today. */
export function getTodaySessions(sessions: StretchSession[]): StretchSession[] {
	const today = todayDateStr();
	return sessions.filter((s) => s.startedAt.startsWith(today));
}

/** Total minutes stretched today. */
export function getTodayMinutes(sessions: StretchSession[]): number {
	return getTodaySessions(sessions).reduce((sum, s) => sum + s.totalDurationSec, 0) / 60;
}

/** Current streak: consecutive days with at least one session. */
export function getCurrentStreak(sessions: StretchSession[]): number {
	if (sessions.length === 0) return 0;

	const sessionDays = new Set(sessions.map((s) => s.startedAt.split('T')[0]));
	let streak = 0;
	const d = new Date();

	// Check today first — if no session today, start from yesterday
	const todayStr = d.toISOString().split('T')[0];
	if (!sessionDays.has(todayStr)) {
		d.setDate(d.getDate() - 1);
	}

	while (true) {
		const dayStr = d.toISOString().split('T')[0];
		if (!sessionDays.has(dayStr)) break;
		streak++;
		d.setDate(d.getDate() - 1);
	}

	return streak;
}

/** Sessions per day for the last N days (for heatmap / bar chart). */
export function getSessionsPerDay(
	sessions: StretchSession[],
	days: number
): { date: string; count: number; minutes: number }[] {
	const result: { date: string; count: number; minutes: number }[] = [];
	const d = new Date();

	for (let i = 0; i < days; i++) {
		const dateStr = d.toISOString().split('T')[0];
		const daySessions = sessions.filter((s) => s.startedAt.startsWith(dateStr));
		result.unshift({
			date: dateStr,
			count: daySessions.length,
			minutes: Math.round(daySessions.reduce((sum, s) => sum + s.totalDurationSec, 0) / 60),
		});
		d.setDate(d.getDate() - 1);
	}

	return result;
}

/** Body region frequency: how often each region was stretched (from session routines). */
export function getBodyRegionBalance(
	sessions: StretchSession[],
	routines: StretchRoutine[]
): { region: BodyRegion; count: number }[] {
	const regionMap = new Map<BodyRegion, number>();

	for (const session of sessions) {
		const routine = routines.find((r) => r.id === session.routineId);
		if (!routine) continue;
		for (const region of routine.targetBodyRegions) {
			regionMap.set(region, (regionMap.get(region) ?? 0) + 1);
		}
	}

	return [...regionMap.entries()]
		.map(([region, count]) => ({ region, count }))
		.sort((a, b) => b.count - a.count);
}

/** Latest assessment (for the dashboard recommendation). */
export function getLatestAssessment(assessments: StretchAssessment[]): StretchAssessment | null {
	return assessments[0] ?? null;
}

/** Weak areas from the latest assessment (score <= 2). */
export function getWeakAreas(assessment: StretchAssessment | null): BodyRegion[] {
	if (!assessment) return [];
	return assessment.tests.filter((t) => t.score <= 2).map((t) => t.bodyRegion);
}

/** Recommend a routine based on weak areas or time of day. */
export function getRecommendedRoutine(
	routines: StretchRoutine[],
	weakAreas: BodyRegion[]
): StretchRoutine | null {
	if (weakAreas.length > 0) {
		// Find a routine that targets the most weak areas
		let best: StretchRoutine | null = null;
		let bestOverlap = 0;
		for (const routine of routines) {
			const overlap = routine.targetBodyRegions.filter((r) => weakAreas.includes(r)).length;
			if (overlap > bestOverlap) {
				bestOverlap = overlap;
				best = routine;
			}
		}
		if (best) return best;
	}

	// Fallback: time-of-day based
	const hour = new Date().getHours();
	if (hour < 11) return routines.find((r) => r.routineType === 'morning') ?? null;
	if (hour < 17) return routines.find((r) => r.routineType === 'desk_break') ?? null;
	return routines.find((r) => r.routineType === 'evening') ?? null;
}

/** Active (non-archived) exercises. */
export function getActiveExercises(exercises: StretchExercise[]): StretchExercise[] {
	return exercises.filter((e) => !e.isArchived);
}

/** Exercises filtered by body region. */
export function getExercisesByRegion(
	exercises: StretchExercise[],
	region: BodyRegion
): StretchExercise[] {
	return exercises.filter((e) => e.bodyRegion === region && !e.isArchived);
}

/** This week's session count (Mon–Sun). */
export function getWeekSessionCount(sessions: StretchSession[]): number {
	const now = new Date();
	const dayOfWeek = now.getDay(); // 0=Sun
	const monday = new Date(now);
	monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
	monday.setHours(0, 0, 0, 0);
	const mondayStr = monday.toISOString().split('T')[0];

	return sessions.filter((s) => s.startedAt.split('T')[0] >= mondayStr).length;
}

/** Coarse "X days ago" formatter. */
export function relativeDays(iso: string, now = new Date()): string {
	const then = new Date(iso);
	const days = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
	if (days <= 0) return 'heute';
	if (days === 1) return 'gestern';
	if (days < 7) return `vor ${days} Tagen`;
	if (days < 30) return `vor ${Math.floor(days / 7)} Wochen`;
	return `vor ${Math.floor(days / 30)} Monaten`;
}
