/**
 * Reactive Queries & Pure Helpers for the Meditate module.
 *
 * Read-side only — mutations live in stores/meditate.svelte.ts.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { decryptRecords } from '$lib/data/crypto';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type {
	LocalMeditatePreset,
	LocalMeditateSession,
	LocalMeditateSettings,
	MeditatePreset,
	MeditateSession,
	MeditateSettings,
} from './types';
import { DEFAULT_SETTINGS } from './types';

// ─── Type Converters ────────────────────────────────────────

export function toMeditatePreset(local: LocalMeditatePreset): MeditatePreset {
	const now = new Date().toISOString();
	return {
		id: local.id,
		name: local.name,
		description: local.description ?? '',
		category: local.category,
		breathPattern: local.breathPattern ?? null,
		bodyScanSteps: local.bodyScanSteps ?? null,
		defaultDurationSec: local.defaultDurationSec,
		isPreset: local.isPreset,
		isArchived: local.isArchived,
		order: local.order,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

export function toMeditateSession(local: LocalMeditateSession): MeditateSession {
	return {
		id: local.id,
		presetId: local.presetId ?? null,
		category: local.category,
		startedAt: local.startedAt,
		durationSec: local.durationSec,
		completed: local.completed,
		moodBefore: local.moodBefore ?? null,
		moodAfter: local.moodAfter ?? null,
		notes: local.notes ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

export function toMeditateSettings(local: LocalMeditateSettings): MeditateSettings {
	return {
		id: local.id,
		bellSound: local.bellSound,
		intervalBell: local.intervalBell,
		intervalSeconds: local.intervalSeconds,
		showBreathGuide: local.showBreathGuide,
		backgroundTheme: local.backgroundTheme,
	};
}

// ─── Live Queries ───────────────────────────────────────────

export function useAllPresets() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db
			.table<LocalMeditatePreset>('meditatePresets')
			.orderBy('order')
			.toArray();
		const visible = locals.filter((p) => !p.deletedAt && !p.isArchived);
		const decrypted = await decryptRecords('meditatePresets', visible);
		return decrypted.map(toMeditatePreset);
	}, [] as MeditatePreset[]);
}

export function useAllSessions() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db
			.table<LocalMeditateSession>('meditateSessions')
			.orderBy('startedAt')
			.reverse()
			.toArray();
		const visible = locals.filter((s) => !s.deletedAt);
		const decrypted = await decryptRecords('meditateSessions', visible);
		return decrypted.map(toMeditateSession);
	}, [] as MeditateSession[]);
}

export function useSettings() {
	return useLiveQueryWithDefault(
		async () => {
			const locals = await scopedForModule<LocalMeditateSettings, string>(
				'meditate',
				'meditateSettings'
			).toArray();
			if (locals.length === 0) return null;
			return toMeditateSettings(locals[0]);
		},
		null as MeditateSettings | null
	);
}

// ─── Pure Helpers (for $derived) ────────────────────────────

export function todayDateStr(): string {
	return new Date().toISOString().split('T')[0];
}

export function getSessionsForDate(sessions: MeditateSession[], date: string): MeditateSession[] {
	return sessions.filter((s) => s.startedAt.split('T')[0] === date);
}

export function getTodaySessions(sessions: MeditateSession[]): MeditateSession[] {
	return getSessionsForDate(sessions, todayDateStr());
}

export function getTodayMinutes(sessions: MeditateSession[]): number {
	return Math.round(getTodaySessions(sessions).reduce((sum, s) => sum + s.durationSec, 0) / 60);
}

export function getWeekSessionCount(sessions: MeditateSession[]): number {
	const now = new Date();
	const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
	return sessions.filter((s) => s.startedAt >= weekAgo).length;
}

export function getWeekMinutes(sessions: MeditateSession[]): number {
	const now = new Date();
	const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
	return Math.round(
		sessions.filter((s) => s.startedAt >= weekAgo).reduce((sum, s) => sum + s.durationSec, 0) / 60
	);
}

export function getCurrentStreak(sessions: MeditateSession[]): number {
	if (sessions.length === 0) return 0;

	const uniqueDays = new Set(sessions.map((s) => s.startedAt.split('T')[0]));
	const today = todayDateStr();
	let streak = 0;
	let d = new Date(today);

	// If no session today, start checking from yesterday
	if (!uniqueDays.has(today)) {
		d.setDate(d.getDate() - 1);
	}

	while (uniqueDays.has(d.toISOString().split('T')[0])) {
		streak++;
		d.setDate(d.getDate() - 1);
	}

	return streak;
}

export function getTotalSessions(sessions: MeditateSession[]): number {
	return sessions.filter((s) => s.completed).length;
}

export function getTotalMinutes(sessions: MeditateSession[]): number {
	return Math.round(sessions.reduce((sum, s) => sum + s.durationSec, 0) / 60);
}

export function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	if (mins === 0) return `${secs}s`;
	if (secs === 0) return `${mins} min`;
	return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function formatDurationLong(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	if (mins === 1) return '1 Minute';
	return `${mins} Minuten`;
}

export function getDefaultSettings(): MeditateSettings {
	return {
		id: 'settings',
		...DEFAULT_SETTINGS,
	};
}
