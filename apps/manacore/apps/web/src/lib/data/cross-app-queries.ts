/**
 * Cross-App Reactive Queries
 *
 * Live queries that read directly from other apps' IndexedDB databases.
 * Auto-update when data changes (local writes, sync, other tabs).
 * Replaces REST API polling with instant reactive reads.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	crossTaskCollection,
	crossEventCollection,
	crossContactCollection,
	type CrossAppTask,
	type CrossAppEvent,
	type CrossAppContact,
} from './cross-app-stores';

// ─── Todo Queries ───────────────────────────────────────────

/** All open (incomplete) tasks, sorted by order. */
export function useOpenTasks() {
	return useLiveQueryWithDefault(async () => {
		const all = await crossTaskCollection.getAll(undefined, {
			sortBy: 'order',
			sortDirection: 'asc',
		});
		return all.filter((t) => !t.isCompleted && !t.deletedAt);
	}, [] as CrossAppTask[]);
}

/** Tasks due today or overdue. */
export function useTodayTasks() {
	return useLiveQueryWithDefault(async () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStr = today.toISOString().slice(0, 10);

		const all = await crossTaskCollection.getAll(undefined, {
			sortBy: 'order',
			sortDirection: 'asc',
		});

		return all.filter((t) => {
			if (t.isCompleted || t.deletedAt) return false;
			if (!t.dueDate) return false;
			const due = t.dueDate.slice(0, 10);
			return due <= todayStr;
		});
	}, [] as CrossAppTask[]);
}

/** Tasks upcoming in the next N days. */
export function useUpcomingTasks(days = 7) {
	return useLiveQueryWithDefault(async () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStr = today.toISOString().slice(0, 10);

		const future = new Date(today);
		future.setDate(future.getDate() + days);
		const futureStr = future.toISOString().slice(0, 10);

		const all = await crossTaskCollection.getAll(undefined, {
			sortBy: 'dueDate',
			sortDirection: 'asc',
		});

		return all.filter((t) => {
			if (t.isCompleted || t.deletedAt) return false;
			if (!t.dueDate) return false;
			const due = t.dueDate.slice(0, 10);
			return due > todayStr && due <= futureStr;
		});
	}, [] as CrossAppTask[]);
}

// ─── Calendar Queries ───────────────────────────────────────

/** Events in the next N days. */
export function useUpcomingEvents(days = 7) {
	return useLiveQueryWithDefault(async () => {
		const now = new Date();
		const future = new Date(now);
		future.setDate(future.getDate() + days);

		const nowStr = now.toISOString();
		const futureStr = future.toISOString();

		const all = await crossEventCollection.getAll(undefined, {
			sortBy: 'startDate',
			sortDirection: 'asc',
		});

		return all.filter((e) => {
			if (e.deletedAt) return false;
			return e.startDate >= nowStr && e.startDate <= futureStr;
		});
	}, [] as CrossAppEvent[]);
}

// ─── Contacts Queries ───────────────────────────────────────

/** Favorite contacts. */
export function useFavoriteContacts(limit = 5) {
	return useLiveQueryWithDefault(async () => {
		const all = await crossContactCollection.getAll(undefined, {
			sortBy: 'firstName',
			sortDirection: 'asc',
		});

		return all.filter((c) => c.isFavorite && !c.isArchived && !c.deletedAt).slice(0, limit);
	}, [] as CrossAppContact[]);
}
