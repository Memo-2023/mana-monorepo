/**
 * Cross-App Reactive Queries
 *
 * Live queries on the unified IndexedDB. Auto-update when data changes
 * (local writes, sync, other tabs) via Dexie's liveQuery.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import { db } from './database';

// ─── Todo Queries ───────────────────────────────────────────

/** All open (incomplete) tasks, sorted by order. */
export function useOpenTasks() {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table('tasks').orderBy('order').toArray();
		return all.filter((t: any) => !t.isCompleted && !t.deletedAt);
	}, [] as any[]);
}

/** Tasks due today or overdue. */
export function useTodayTasks() {
	return useLiveQueryWithDefault(async () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStr = today.toISOString().slice(0, 10);

		const all = await db.table('tasks').orderBy('order').toArray();
		return all.filter((t: any) => {
			if (t.isCompleted || t.deletedAt) return false;
			if (!t.dueDate) return false;
			return t.dueDate.slice(0, 10) <= todayStr;
		});
	}, [] as any[]);
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

		const all = await db.table('tasks').orderBy('dueDate').toArray();
		return all.filter((t: any) => {
			if (t.isCompleted || t.deletedAt) return false;
			if (!t.dueDate) return false;
			const due = t.dueDate.slice(0, 10);
			return due > todayStr && due <= futureStr;
		});
	}, [] as any[]);
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

		const all = await db.table('events').orderBy('startDate').toArray();
		return all.filter((e: any) => {
			if (e.deletedAt) return false;
			return e.startDate >= nowStr && e.startDate <= futureStr;
		});
	}, [] as any[]);
}

// ─── Contacts Queries ───────────────────────────────────────

/** Favorite contacts. */
export function useFavoriteContacts(limit = 5) {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table('contacts').orderBy('firstName').toArray();
		return all.filter((c: any) => c.isFavorite && !c.isArchived && !c.deletedAt).slice(0, limit);
	}, [] as any[]);
}

// ─── Chat Queries ───────────────────────────────────────────

/** Recent conversations, sorted by updatedAt desc. */
export function useRecentConversations(limit = 5) {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table('conversations').toArray();
		return all
			.filter((c: any) => !c.isArchived && !c.deletedAt)
			.sort((a: any, b: any) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
			.slice(0, limit);
	}, [] as any[]);
}

// ─── Zitare Queries ─────────────────────────────────────────

/** A random favorite quote. */
export function useRandomFavorite() {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table('zitareFavorites').toArray();
		const active = all.filter((f: any) => !f.deletedAt);
		if (active.length === 0) return null;
		return active[Math.floor(Math.random() * active.length)];
	}, null as any);
}

// ─── Picture Queries ────────────────────────────────────────

/** Recent generated images. */
export function useRecentImages(limit = 6) {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table('images').toArray();
		return all
			.filter((i: any) => !i.archivedAt && !i.deletedAt)
			.sort((a: any, b: any) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
			.slice(0, limit);
	}, [] as any[]);
}

// ─── Clock Queries ──────────────────────────────────────────

/** Enabled alarms. */
export function useEnabledAlarms() {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table('alarms').toArray();
		return all.filter((a: any) => a.enabled && !a.deletedAt);
	}, [] as any[]);
}

/** Active/running timers. */
export function useActiveTimers() {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table('timers').toArray();
		return all.filter(
			(t: any) => (t.status === 'running' || t.status === 'paused') && !t.deletedAt
		);
	}, [] as any[]);
}

// ─── Storage Queries ────────────────────────────────────────

/** Storage stats: total files and total size. */
export function useStorageStats() {
	return useLiveQueryWithDefault(
		async () => {
			const files = await db.table('files').toArray();
			const active = files.filter((f: any) => !f.isDeleted && !f.deletedAt);
			const totalSize = active.reduce((sum: number, f: any) => sum + (f.size || 0), 0);
			const recent = active
				.sort((a: any, b: any) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
				.slice(0, 5);
			return { totalFiles: active.length, totalSize, recentFiles: recent };
		},
		{ totalFiles: 0, totalSize: 0, recentFiles: [] as any[] }
	);
}

// ─── Mukke Queries ──────────────────────────────────────────

/** Mukke library stats + recent songs. */
export function useMukkeStats() {
	return useLiveQueryWithDefault(
		async () => {
			const songs = await db.table('songs').toArray();
			const playlists = await db.table('mukkePlaylists').toArray();
			const activeSongs = songs.filter((s: any) => !s.deletedAt);
			const activePlaylists = playlists.filter((p: any) => !p.deletedAt);
			const recent = activeSongs
				.sort((a: any, b: any) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
				.slice(0, 5);
			return {
				totalSongs: activeSongs.length,
				totalPlaylists: activePlaylists.length,
				favoriteCount: activeSongs.filter((s: any) => s.favorite).length,
				recentSongs: recent,
			};
		},
		{ totalSongs: 0, totalPlaylists: 0, favoriteCount: 0, recentSongs: [] as any[] }
	);
}

// ─── Presi Queries ──────────────────────────────────────────

/** Recent presentation decks. */
export function useRecentDecks(limit = 5) {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table('presiDecks').toArray();
		return all
			.filter((d: any) => !d.deletedAt)
			.sort((a: any, b: any) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
			.slice(0, limit);
	}, [] as any[]);
}

// ─── Context Queries ────────────────────────────────────────

/** Recent documents + spaces. */
export function useRecentDocuments(limit = 5) {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table('documents').toArray();
		return all
			.filter((d: any) => !d.deletedAt)
			.sort((a: any, b: any) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
			.slice(0, limit);
	}, [] as any[]);
}

export function useSpaces() {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table('contextSpaces').toArray();
		return all
			.filter((s: any) => !s.deletedAt)
			.sort((a: any, b: any) => {
				if (a.pinned && !b.pinned) return -1;
				if (!a.pinned && b.pinned) return 1;
				return 0;
			});
	}, [] as any[]);
}

// ─── Cards Queries ─────────────────────────────────────────

/** Cards learning progress. */
export function useCardsProgress() {
	return useLiveQueryWithDefault(
		async () => {
			const decks = await db.table('cardDecks').toArray();
			const cards = await db.table('cards').toArray();
			const activeDecks = decks.filter((d: any) => !d.deletedAt);
			const activeCards = cards.filter((c: any) => !c.deletedAt);
			const now = new Date().toISOString();
			const dueCards = activeCards.filter((c: any) => c.nextReview && c.nextReview <= now);
			return {
				totalDecks: activeDecks.length,
				totalCards: activeCards.length,
				cardsLearned: activeCards.filter((c: any) => (c.reviewCount ?? 0) > 0).length,
				dueForReview: dueCards.length,
				decks: activeDecks,
			};
		},
		{
			totalDecks: 0,
			totalCards: 0,
			cardsLearned: 0,
			dueForReview: 0,
			decks: [] as any[],
		}
	);
}
