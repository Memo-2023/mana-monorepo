/**
 * Reactive Queries & Pure Helpers for Times module.
 *
 * Uses Dexie liveQuery on the unified database.
 */

import { liveQuery } from 'dexie';
import { db } from '$lib/data/database';
import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import type {
	LocalClient,
	LocalProject,
	LocalTimeEntry,
	LocalTemplate,
	LocalSettings,
	LocalAlarm,
	LocalCountdownTimer,
	LocalWorldClock,
	Client,
	Project,
	TimeEntry,
	Tag,
	EntryTemplate,
	TimesSettings,
	FilterCriteria,
	SortOption,
} from './types';
import type { Alarm, Timer, WorldClock } from './types';
import type { LocalTimeBlock } from '$lib/data/time-blocks/types';

// ─── Type Converters ───────────────────────────────────────

export function toClient(local: LocalClient): Client {
	return {
		id: local.id,
		name: local.name,
		shortCode: local.shortCode ?? undefined,
		contactId: local.contactId ?? undefined,
		email: local.email ?? undefined,
		color: local.color,
		isArchived: local.isArchived,
		billingRate: local.billingRate ?? undefined,
		notes: local.notes ?? undefined,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toProject(local: LocalProject): Project {
	return {
		id: local.id,
		clientId: local.clientId ?? undefined,
		name: local.name,
		description: local.description ?? undefined,
		color: local.color,
		isArchived: local.isArchived,
		isBillable: local.isBillable,
		billingRate: local.billingRate ?? undefined,
		budget: local.budget ?? undefined,
		visibility: local.visibility,
		guildId: local.guildId ?? undefined,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Convert LocalTimeEntry + its TimeBlock into a domain TimeEntry. */
export function toTimeEntry(local: LocalTimeEntry, block?: LocalTimeBlock | null): TimeEntry {
	const now = new Date().toISOString();
	return {
		id: local.id,
		timeBlockId: local.timeBlockId,
		projectId: local.projectId ?? undefined,
		clientId: local.clientId ?? undefined,
		description: local.description,
		// Time fields derived from TimeBlock
		date: block?.startDate?.split('T')[0] ?? now.split('T')[0],
		startTime: block?.startDate ?? undefined,
		endTime: block?.endDate ?? undefined,
		isRunning: block?.isLive ?? false,
		duration: local.duration,
		isBillable: local.isBillable,
		tags: local.tags,
		billingRate: local.billingRate ?? undefined,
		visibility: local.visibility,
		guildId: local.guildId ?? undefined,
		source: local.source ?? undefined,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

export function toTemplate(local: LocalTemplate): EntryTemplate {
	return {
		id: local.id,
		name: local.name,
		projectId: local.projectId ?? undefined,
		clientId: local.clientId ?? undefined,
		description: local.description,
		isBillable: local.isBillable,
		tags: local.tags,
		usageCount: local.usageCount,
		lastUsedAt: local.lastUsedAt ?? undefined,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toSettings(local: LocalSettings): TimesSettings {
	return {
		id: local.id,
		defaultBillingRate: local.defaultBillingRate ?? undefined,
		workingHoursPerDay: local.workingHoursPerDay,
		workingDaysPerWeek: local.workingDaysPerWeek,
		roundingIncrement: local.roundingIncrement,
		roundingMethod: local.roundingMethod,
		defaultVisibility: local.defaultVisibility,
		weekStartsOn: local.weekStartsOn,
		timerReminderMinutes: local.timerReminderMinutes,
		autoStopTimerHours: local.autoStopTimerHours,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Clock Type Converters (merged from clock module) ─────

export function toAlarm(local: LocalAlarm): Alarm {
	return {
		id: local.id,
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

export function toCountdownTimer(local: LocalCountdownTimer): Timer {
	return {
		id: local.id,
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
		timezone: local.timezone,
		cityName: local.cityName,
		sortOrder: local.sortOrder,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

export function useAllClients() {
	return liveQuery(async () => {
		const locals = await db.table<LocalClient>('timeClients').toArray();
		return locals.filter((c) => !c.deletedAt).map(toClient);
	});
}

export function useAllProjects() {
	return liveQuery(async () => {
		const locals = await db.table<LocalProject>('timeProjects').toArray();
		return locals.filter((p) => !p.deletedAt).map(toProject);
	});
}

export function useAllTimeEntries() {
	return liveQuery(async () => {
		const locals = await db.table<LocalTimeEntry>('timeEntries').toArray();
		const active = locals.filter((e) => !e.deletedAt);

		// Batch-fetch all related timeBlocks
		const blockIds = active.map((e) => e.timeBlockId).filter(Boolean);
		const blocks =
			blockIds.length > 0
				? await db.table<LocalTimeBlock>('timeBlocks').where('id').anyOf(blockIds).toArray()
				: [];
		const blocksById = new Map(blocks.map((b) => [b.id, b]));

		return active.map((e) => toTimeEntry(e, blocksById.get(e.timeBlockId)));
	});
}

// Tags: use shared global tags from @mana/shared-stores
export { useAllTags } from '@mana/shared-stores';

export function useAllTemplates() {
	return liveQuery(async () => {
		const locals = await db.table<LocalTemplate>('timeTemplates').toArray();
		return locals.filter((t) => !t.deletedAt).map(toTemplate);
	});
}

export function useSettings() {
	return liveQuery(async () => {
		const locals = await db.table<LocalSettings>('timeSettings').toArray();
		const active = locals.filter((s) => !s.deletedAt);
		return active.length > 0 ? toSettings(active[0]) : null;
	});
}

// ─── Clock Raw Observable Queries ─────────────────────────

/** All alarms as raw observable. */
export function allAlarms$() {
	return liveQuery(async () => {
		const locals = await db.table<LocalAlarm>('timeAlarms').toArray();
		return locals.filter((a) => !a.deletedAt).map(toAlarm);
	});
}

/** All countdown timers as raw observable. */
export function allCountdownTimers$() {
	return liveQuery(async () => {
		const locals = await db.table<LocalCountdownTimer>('timeCountdownTimers').toArray();
		return locals.filter((t) => !t.deletedAt).map(toCountdownTimer);
	});
}

/** All world clocks as raw observable, sorted by sortOrder. */
export function allWorldClocks$() {
	return liveQuery(async () => {
		const locals = await db
			.table<LocalWorldClock>('timeWorldClocks')
			.orderBy('sortOrder')
			.toArray();
		return locals.filter((wc) => !wc.deletedAt).map(toWorldClock);
	});
}

// ─── Clock Svelte 5 Reactive Hooks ────────────────────────

/** All alarms, auto-updates on any change. Returns { value, loading, error }. */
export function useAllAlarms() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalAlarm>('timeAlarms').toArray();
		return locals.filter((a) => !a.deletedAt).map(toAlarm);
	}, [] as Alarm[]);
}

/** All countdown timers, auto-updates on any change. Returns { value, loading, error }. */
export function useAllCountdownTimers() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalCountdownTimer>('timeCountdownTimers').toArray();
		return locals.filter((t) => !t.deletedAt).map(toCountdownTimer);
	}, [] as Timer[]);
}

/** All world clocks, sorted by sortOrder. Returns { value, loading, error }. */
export function useAllWorldClocks() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db
			.table<LocalWorldClock>('timeWorldClocks')
			.orderBy('sortOrder')
			.toArray();
		return locals.filter((wc) => !wc.deletedAt).map(toWorldClock);
	}, [] as WorldClock[]);
}

// ─── Clock Pure Filter Functions ──────────────────────────

export function filterEnabledAlarms(alarms: Alarm[]): Alarm[] {
	return alarms.filter((a) => a.enabled);
}

export function filterActiveCountdownTimers(timers: Timer[]): Timer[] {
	return timers.filter((t) => t.status === 'running' || t.status === 'paused');
}

export function sortWorldClocksByOrder(clocks: WorldClock[]): WorldClock[] {
	return [...clocks].sort((a, b) => a.sortOrder - b.sortOrder);
}

// ─── Pure Helpers ──────────────────────────────────────────

/** Format duration in seconds to HH:MM:SS */
export function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Format duration in seconds to compact form (e.g., "2h 30m") */
export function formatDurationCompact(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	if (h === 0) return `${m}m`;
	if (m === 0) return `${h}h`;
	return `${h}h ${m}m`;
}

/** Format duration in seconds to decimal hours (e.g., "2.50") */
export function formatDurationDecimal(seconds: number): string {
	return (seconds / 3600).toFixed(2);
}

/** Get entries for a specific date */
export function getEntriesByDate(entries: TimeEntry[], date: string): TimeEntry[] {
	return entries
		.filter((e) => e.date === date)
		.sort((a, b) => {
			if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
			return 0;
		});
}

/** Get entries for a date range */
export function getEntriesByDateRange(entries: TimeEntry[], from: string, to: string): TimeEntry[] {
	return entries.filter((e) => e.date >= from && e.date <= to);
}

/** Get total duration for a list of entries */
export function getTotalDuration(entries: TimeEntry[]): number {
	return entries.reduce((sum, e) => sum + e.duration, 0);
}

/** Get billable duration for a list of entries */
export function getBillableDuration(entries: TimeEntry[]): number {
	return entries.filter((e) => e.isBillable).reduce((sum, e) => sum + e.duration, 0);
}

/** Group entries by date */
export function groupEntriesByDate(entries: TimeEntry[]): Map<string, TimeEntry[]> {
	const groups = new Map<string, TimeEntry[]>();
	for (const entry of entries) {
		const existing = groups.get(entry.date) || [];
		existing.push(entry);
		groups.set(entry.date, existing);
	}
	return groups;
}

/** Group entries by project */
export function groupEntriesByProject(entries: TimeEntry[]): Map<string, TimeEntry[]> {
	const groups = new Map<string, TimeEntry[]>();
	for (const entry of entries) {
		const key = entry.projectId || 'no-project';
		const existing = groups.get(key) || [];
		existing.push(entry);
		groups.set(key, existing);
	}
	return groups;
}

/** Filter entries by criteria */
export function getFilteredEntries(entries: TimeEntry[], filters: FilterCriteria): TimeEntry[] {
	let result = entries;

	if (filters.projectId) {
		result = result.filter((e) => e.projectId === filters.projectId);
	}
	if (filters.clientId) {
		result = result.filter((e) => e.clientId === filters.clientId);
	}
	if (filters.isBillable !== undefined) {
		result = result.filter((e) => e.isBillable === filters.isBillable);
	}
	if (filters.tagIds?.length) {
		result = result.filter((e) => filters.tagIds!.some((t) => e.tags.includes(t)));
	}
	if (filters.dateFrom) {
		result = result.filter((e) => e.date >= filters.dateFrom!);
	}
	if (filters.dateTo) {
		result = result.filter((e) => e.date <= filters.dateTo!);
	}
	if (filters.search) {
		const q = filters.search.toLowerCase();
		result = result.filter((e) => e.description.toLowerCase().includes(q));
	}

	return result;
}

/** Sort entries */
export function getSortedEntries(entries: TimeEntry[], sort: SortOption): TimeEntry[] {
	return [...entries].sort((a, b) => {
		let cmp = 0;
		switch (sort.field) {
			case 'date':
				cmp = a.date.localeCompare(b.date);
				if (cmp === 0 && a.startTime && b.startTime) {
					cmp = a.startTime.localeCompare(b.startTime);
				}
				break;
			case 'duration':
				cmp = a.duration - b.duration;
				break;
			case 'project':
				cmp = (a.projectId || '').localeCompare(b.projectId || '');
				break;
			case 'client':
				cmp = (a.clientId || '').localeCompare(b.clientId || '');
				break;
			case 'createdAt':
				cmp = (a.createdAt || '').localeCompare(b.createdAt || '');
				break;
		}
		return sort.direction === 'desc' ? -cmp : cmp;
	});
}

/** Get active projects (not archived) */
export function getActiveProjects(projects: Project[]): Project[] {
	return projects.filter((p) => !p.isArchived).sort((a, b) => a.order - b.order);
}

/** Get active clients (not archived) */
export function getActiveClients(clients: Client[]): Client[] {
	return clients.filter((c) => !c.isArchived).sort((a, b) => a.order - b.order);
}

/** Get project by ID */
export function getProjectById(projects: Project[], id: string): Project | undefined {
	return projects.find((p) => p.id === id);
}

/** Get client by ID */
export function getClientById(clients: Client[], id: string): Client | undefined {
	return clients.find((c) => c.id === id);
}

/** Get projects for a client */
export function getProjectsByClient(projects: Project[], clientId: string): Project[] {
	return projects.filter((p) => p.clientId === clientId);
}
