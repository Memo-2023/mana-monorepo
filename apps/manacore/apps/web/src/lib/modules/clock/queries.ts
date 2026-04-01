/**
 * Reactive Queries & Pure Helpers for Clock module.
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { liveQuery } from 'dexie';
import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import { db } from '$lib/data/database';
import type { LocalAlarm, LocalTimer, LocalWorldClock } from './types';
import type { Alarm, Timer, WorldClock } from '@clock/shared';

// ─── Type Converters ───────────────────────────────────────

export function toAlarm(local: LocalAlarm): Alarm {
	return {
		id: local.id,
		userId: 'local',
		label: local.label,
		time: local.time,
		enabled: local.enabled,
		repeatDays: local.repeatDays,
		snoozeMinutes: local.snoozeMinutes,
		sound: local.sound,
		vibrate: local.vibrate ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toTimer(local: LocalTimer): Timer {
	return {
		id: local.id,
		userId: 'local',
		label: local.label,
		durationSeconds: local.durationSeconds,
		remainingSeconds: local.remainingSeconds,
		status: local.status,
		startedAt: local.startedAt,
		pausedAt: local.pausedAt,
		sound: local.sound,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toWorldClock(local: LocalWorldClock): WorldClock {
	return {
		id: local.id,
		userId: 'local',
		timezone: local.timezone,
		cityName: local.cityName,
		sortOrder: local.sortOrder,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

// ─── Raw Observable Queries (for Svelte $ auto-subscribe) ──

/** All alarms as raw observable. */
export function allAlarms$() {
	return liveQuery(async () => {
		const locals = await db.table<LocalAlarm>('alarms').toArray();
		return locals.filter((a) => !a.deletedAt).map(toAlarm);
	});
}

/** All timers as raw observable. */
export function allTimers$() {
	return liveQuery(async () => {
		const locals = await db.table<LocalTimer>('timers').toArray();
		return locals.filter((t) => !t.deletedAt).map(toTimer);
	});
}

/** All world clocks as raw observable, sorted by sortOrder. */
export function allWorldClocks$() {
	return liveQuery(async () => {
		const locals = await db.table<LocalWorldClock>('worldClocks').orderBy('sortOrder').toArray();
		return locals.filter((wc) => !wc.deletedAt).map(toWorldClock);
	});
}

// ─── Svelte 5 Reactive Hooks (call during component init) ──

/** All alarms, auto-updates on any change. Returns { value, loading, error }. */
export function useAllAlarms() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalAlarm>('alarms').toArray();
		return locals.filter((a) => !a.deletedAt).map(toAlarm);
	}, [] as Alarm[]);
}

/** All timers, auto-updates on any change. Returns { value, loading, error }. */
export function useAllTimers() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalTimer>('timers').toArray();
		return locals.filter((t) => !t.deletedAt).map(toTimer);
	}, [] as Timer[]);
}

/** All world clocks, sorted by sortOrder. Returns { value, loading, error }. */
export function useAllWorldClocks() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalWorldClock>('worldClocks').orderBy('sortOrder').toArray();
		return locals.filter((wc) => !wc.deletedAt).map(toWorldClock);
	}, [] as WorldClock[]);
}

// ─── Pure Filter Functions (for $derived) ──────────────────

export function filterEnabledAlarms(alarms: Alarm[]): Alarm[] {
	return alarms.filter((a) => a.enabled);
}

export function filterActiveTimers(timers: Timer[]): Timer[] {
	return timers.filter((t) => t.status === 'running' || t.status === 'paused');
}

export function sortWorldClocksByOrder(clocks: WorldClock[]): WorldClock[] {
	return [...clocks].sort((a, b) => a.sortOrder - b.sortOrder);
}
