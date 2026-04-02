/**
 * Reactive Queries & Pure Helpers for Times
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs).
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	clientCollection,
	projectCollection,
	timeEntryCollection,
	tagCollection,
	templateCollection,
	settingsCollection,
	alarmCollection,
	countdownTimerCollection,
	worldClockCollection,
	type LocalClient,
	type LocalProject,
	type LocalTimeEntry,
	type LocalTag,
	type LocalTemplate,
	type LocalSettings,
	type LocalAlarm,
	type LocalCountdownTimer,
	type LocalWorldClock,
} from './local-store';
import type {
	Client,
	Project,
	TimeEntry,
	Tag,
	EntryTemplate,
	TimesSettings,
	FilterCriteria,
	SortOption,
	Alarm,
	CountdownTimer,
	WorldClock,
} from '@times/shared';

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

export function toTimeEntry(local: LocalTimeEntry): TimeEntry {
	return {
		id: local.id,
		projectId: local.projectId ?? undefined,
		clientId: local.clientId ?? undefined,
		description: local.description,
		date: local.date,
		startTime: local.startTime ?? undefined,
		endTime: local.endTime ?? undefined,
		duration: local.duration,
		isBillable: local.isBillable,
		isRunning: local.isRunning,
		tags: local.tags,
		billingRate: local.billingRate ?? undefined,
		visibility: local.visibility,
		guildId: local.guildId ?? undefined,
		source: local.source ?? undefined,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toTag(local: LocalTag): Tag {
	return {
		id: local.id,
		name: local.name,
		color: local.color,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
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

// ─── Live Query Hooks ──────────────────────────────────────

export function useAllClients() {
	return useLiveQueryWithDefault(async () => {
		const locals = await clientCollection.getAll();
		return locals.map(toClient);
	}, [] as Client[]);
}

export function useAllProjects() {
	return useLiveQueryWithDefault(async () => {
		const locals = await projectCollection.getAll();
		return locals.map(toProject);
	}, [] as Project[]);
}

export function useAllTimeEntries() {
	return useLiveQueryWithDefault(async () => {
		const locals = await timeEntryCollection.getAll();
		return locals.map(toTimeEntry);
	}, [] as TimeEntry[]);
}

export function useAllTags() {
	return useLiveQueryWithDefault(async () => {
		const locals = await tagCollection.getAll();
		return locals.map(toTag);
	}, [] as Tag[]);
}

export function useAllTemplates() {
	return useLiveQueryWithDefault(async () => {
		const locals = await templateCollection.getAll();
		return locals.map(toTemplate);
	}, [] as EntryTemplate[]);
}

export function useSettings() {
	return useLiveQueryWithDefault(
		async () => {
			const locals = await settingsCollection.getAll();
			return locals.length > 0 ? toSettings(locals[0]) : null;
		},
		null as TimesSettings | null
	);
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

// ─── Clock Type Converters ───────────────────────────────────

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

export function toCountdownTimer(local: LocalCountdownTimer): CountdownTimer {
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

// ─── Clock Live Query Hooks ──────────────────────────────────

export function useAllAlarms() {
	return useLiveQueryWithDefault(async () => {
		const locals = await alarmCollection.getAll();
		return locals.map(toAlarm);
	}, [] as Alarm[]);
}

export function useAllCountdownTimers() {
	return useLiveQueryWithDefault(async () => {
		const locals = await countdownTimerCollection.getAll();
		return locals.map(toCountdownTimer);
	}, [] as CountdownTimer[]);
}

export function useAllWorldClocks() {
	return useLiveQueryWithDefault(async () => {
		const locals = await worldClockCollection.getAll(undefined, {
			sortBy: 'sortOrder',
			sortDirection: 'asc',
		});
		return locals.map(toWorldClock);
	}, [] as WorldClock[]);
}

// ─── Clock Pure Helpers ──────────────────────────────────────

export function filterEnabledAlarms(alarms: Alarm[]): Alarm[] {
	return alarms.filter((a) => a.enabled);
}

export function filterActiveCountdownTimers(timers: CountdownTimer[]): CountdownTimer[] {
	return timers.filter((t) => t.status === 'running' || t.status === 'paused');
}

export function sortWorldClocksByOrder(clocks: WorldClock[]): WorldClock[] {
	return [...clocks].sort((a, b) => a.sortOrder - b.sortOrder);
}
