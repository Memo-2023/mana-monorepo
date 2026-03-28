/**
 * Reactive Queries & Pure Helpers for Clock
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	alarmCollection,
	timerCollection,
	worldClockCollection,
	type LocalAlarm,
	type LocalTimer,
	type LocalWorldClock,
} from './local-store';
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

// ─── Live Query Hooks (call during component init) ─────────

/** All alarms, auto-updates on any change. */
export function useAllAlarms() {
	return useLiveQueryWithDefault(async () => {
		const locals = await alarmCollection.getAll();
		return locals.map(toAlarm);
	}, [] as Alarm[]);
}

/** All timers, auto-updates on any change. */
export function useAllTimers() {
	return useLiveQueryWithDefault(async () => {
		const locals = await timerCollection.getAll();
		return locals.map(toTimer);
	}, [] as Timer[]);
}

/** All world clocks, sorted by sortOrder. Auto-updates on any change. */
export function useAllWorldClocks() {
	return useLiveQueryWithDefault(async () => {
		const locals = await worldClockCollection.getAll(undefined, {
			sortBy: 'sortOrder',
			sortDirection: 'asc',
		});
		return locals.map(toWorldClock);
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
