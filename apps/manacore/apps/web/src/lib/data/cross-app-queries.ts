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
	crossConversationCollection,
	crossFavoriteCollection,
	crossImageCollection,
	crossAlarmCollection,
	crossTimerCollection,
	crossFileCollection,
	crossSongCollection,
	crossPlaylistCollection,
	crossPresiDeckCollection,
	crossSpaceCollection,
	crossDocumentCollection,
	crossCardsDeckCollection,
	crossCardsCardCollection,
	type CrossAppTask,
	type CrossAppEvent,
	type CrossAppContact,
	type CrossAppConversation,
	type CrossAppFavorite,
	type CrossAppImage,
	type CrossAppAlarm,
	type CrossAppTimer,
	type CrossAppFile,
	type CrossAppSong,
	type CrossAppPlaylist,
	type CrossAppDeck,
	type CrossAppSpace,
	type CrossAppDocument,
	type CrossAppCardsDeck,
	type CrossAppCardsCard,
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

// ─── Chat Queries ───────────────────────────────────────────

/** Recent conversations, sorted by updatedAt desc. */
export function useRecentConversations(limit = 5) {
	return useLiveQueryWithDefault(async () => {
		const all = await crossConversationCollection.getAll(undefined, {
			sortBy: 'updatedAt',
			sortDirection: 'desc',
		});
		return all.filter((c) => !c.isArchived && !c.deletedAt).slice(0, limit);
	}, [] as CrossAppConversation[]);
}

// ─── Zitare Queries ─────────────────────────────────────────

/** A random favorite quote. */
export function useRandomFavorite() {
	return useLiveQueryWithDefault(
		async () => {
			const all = await crossFavoriteCollection.getAll();
			const active = all.filter((f) => !f.deletedAt);
			if (active.length === 0) return null;
			return active[Math.floor(Math.random() * active.length)];
		},
		null as CrossAppFavorite | null
	);
}

// ─── Picture Queries ────────────────────────────────────────

/** Recent generated images. */
export function useRecentImages(limit = 6) {
	return useLiveQueryWithDefault(async () => {
		const all = await crossImageCollection.getAll(undefined, {
			sortBy: 'createdAt',
			sortDirection: 'desc',
		});
		return all.filter((i) => !i.archivedAt && !i.deletedAt).slice(0, limit);
	}, [] as CrossAppImage[]);
}

// ─── Clock Queries ──────────────────────────────────────────

/** Enabled alarms. */
export function useEnabledAlarms() {
	return useLiveQueryWithDefault(async () => {
		const all = await crossAlarmCollection.getAll();
		return all.filter((a) => a.enabled && !a.deletedAt);
	}, [] as CrossAppAlarm[]);
}

/** Active/running timers. */
export function useActiveTimers() {
	return useLiveQueryWithDefault(async () => {
		const all = await crossTimerCollection.getAll();
		return all.filter((t) => (t.status === 'running' || t.status === 'paused') && !t.deletedAt);
	}, [] as CrossAppTimer[]);
}

// ─── Storage Queries ────────────────────────────────────────

/** Storage stats: total files and total size. */
export function useStorageStats() {
	return useLiveQueryWithDefault(
		async () => {
			const files = await crossFileCollection.getAll();
			const active = files.filter((f) => !f.isDeleted && !f.deletedAt);
			const totalSize = active.reduce((sum, f) => sum + (f.size || 0), 0);
			const recent = active
				.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
				.slice(0, 5);
			return { totalFiles: active.length, totalSize, recentFiles: recent };
		},
		{ totalFiles: 0, totalSize: 0, recentFiles: [] as CrossAppFile[] }
	);
}

// ─── Mukke Queries ──────────────────────────────────────────

/** Mukke library stats + recent songs. */
export function useMukkeStats() {
	return useLiveQueryWithDefault(
		async () => {
			const songs = await crossSongCollection.getAll();
			const playlists = await crossPlaylistCollection.getAll();
			const activeSongs = songs.filter((s) => !s.deletedAt);
			const activePlaylists = playlists.filter((p) => !p.deletedAt);
			const recent = activeSongs
				.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
				.slice(0, 5);
			return {
				totalSongs: activeSongs.length,
				totalPlaylists: activePlaylists.length,
				favoriteCount: activeSongs.filter((s) => s.favorite).length,
				recentSongs: recent,
			};
		},
		{ totalSongs: 0, totalPlaylists: 0, favoriteCount: 0, recentSongs: [] as CrossAppSong[] }
	);
}

// ─── Presi Queries ──────────────────────────────────────────

/** Recent presentation decks. */
export function useRecentDecks(limit = 5) {
	return useLiveQueryWithDefault(async () => {
		const all = await crossPresiDeckCollection.getAll(undefined, {
			sortBy: 'updatedAt',
			sortDirection: 'desc',
		});
		return all.filter((d) => !d.deletedAt).slice(0, limit);
	}, [] as CrossAppDeck[]);
}

// ─── Context Queries ────────────────────────────────────────

/** Recent documents + spaces. */
export function useRecentDocuments(limit = 5) {
	return useLiveQueryWithDefault(async () => {
		const all = await crossDocumentCollection.getAll(undefined, {
			sortBy: 'updatedAt',
			sortDirection: 'desc',
		});
		return all.filter((d) => !d.deletedAt).slice(0, limit);
	}, [] as CrossAppDocument[]);
}

export function useSpaces() {
	return useLiveQueryWithDefault(async () => {
		const all = await crossSpaceCollection.getAll(undefined, {
			sortBy: 'pinned',
			sortDirection: 'desc',
		});
		return all.filter((s) => !s.deletedAt);
	}, [] as CrossAppSpace[]);
}

// ─── Cards Queries ─────────────────────────────────────────

/** Cards learning progress. */
export function useCardsProgress() {
	return useLiveQueryWithDefault(
		async () => {
			const decks = await crossCardsDeckCollection.getAll();
			const cards = await crossCardsCardCollection.getAll();
			const activeDecks = decks.filter((d) => !d.deletedAt);
			const activeCards = cards.filter((c) => !c.deletedAt);
			const now = new Date().toISOString();
			const dueCards = activeCards.filter((c) => c.nextReview && c.nextReview <= now);
			return {
				totalDecks: activeDecks.length,
				totalCards: activeCards.length,
				cardsLearned: activeCards.filter((c) => (c.reviewCount ?? 0) > 0).length,
				dueForReview: dueCards.length,
				decks: activeDecks,
			};
		},
		{
			totalDecks: 0,
			totalCards: 0,
			cardsLearned: 0,
			dueForReview: 0,
			decks: [] as CrossAppCardsDeck[],
		}
	);
}
