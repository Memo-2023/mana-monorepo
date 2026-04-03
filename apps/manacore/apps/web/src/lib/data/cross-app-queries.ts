/**
 * Cross-App Reactive Queries
 *
 * Live queries on the unified IndexedDB. Auto-update when data changes
 * (local writes, sync, other tabs) via Dexie's liveQuery.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import { db } from './database';

import type { LocalTask } from '$lib/modules/todo/types';
import type { LocalEvent } from '$lib/modules/calendar/types';
import type { LocalContact } from '$lib/modules/contacts/types';
import type { LocalConversation } from '$lib/modules/chat/types';
import type { LocalFavorite } from '$lib/modules/zitare/types';
import type { LocalImage } from '$lib/modules/picture/types';
import type { LocalAlarm, LocalCountdownTimer } from '$lib/modules/times/types';
import type { LocalFile } from '$lib/modules/storage/types';
import type { LocalSong, LocalPlaylist } from '$lib/modules/mukke/types';
import type { LocalDeck as LocalPresiDeck } from '$lib/modules/presi/types';
import type { LocalDocument, LocalContextSpace } from '$lib/modules/context/types';
import type { LocalDeck as LocalCardDeck, LocalCard } from '$lib/modules/cards/types';

// ─── Todo Queries ───────────────────────────────────────────

/** All open (incomplete) tasks, sorted by order. */
export function useOpenTasks() {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalTask>('tasks').orderBy('order').toArray();
		return all.filter((t) => !t.isCompleted && !t.deletedAt);
	}, [] as LocalTask[]);
}

/** Tasks due today or overdue. */
export function useTodayTasks() {
	return useLiveQueryWithDefault(async () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStr = today.toISOString().slice(0, 10);

		const all = await db.table<LocalTask>('tasks').orderBy('order').toArray();
		return all.filter((t) => {
			if (t.isCompleted || t.deletedAt) return false;
			if (!t.dueDate) return false;
			return t.dueDate.slice(0, 10) <= todayStr;
		});
	}, [] as LocalTask[]);
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

		const all = await db.table<LocalTask>('tasks').orderBy('dueDate').toArray();
		return all.filter((t) => {
			if (t.isCompleted || t.deletedAt) return false;
			if (!t.dueDate) return false;
			const due = t.dueDate.slice(0, 10);
			return due > todayStr && due <= futureStr;
		});
	}, [] as LocalTask[]);
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

		const all = await db.table<LocalEvent>('events').orderBy('startDate').toArray();
		return all.filter((e) => {
			if (e.deletedAt) return false;
			return e.startDate >= nowStr && e.startDate <= futureStr;
		});
	}, [] as LocalEvent[]);
}

// ─── Contacts Queries ───────────────────────────────────────

/** Favorite contacts. */
export function useFavoriteContacts(limit = 5) {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalContact>('contacts').orderBy('firstName').toArray();
		return all.filter((c) => c.isFavorite && !c.isArchived && !c.deletedAt).slice(0, limit);
	}, [] as LocalContact[]);
}

// ─── Chat Queries ───────────────────────────────────────────

/** Recent conversations, sorted by updatedAt desc. */
export function useRecentConversations(limit = 5) {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalConversation>('conversations').toArray();
		return all
			.filter((c) => !c.isArchived && !c.deletedAt)
			.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
			.slice(0, limit);
	}, [] as LocalConversation[]);
}

// ─── Zitare Queries ─────────────────────────────────────────

/** A random favorite quote. */
export function useRandomFavorite() {
	return useLiveQueryWithDefault(
		async () => {
			const all = await db.table<LocalFavorite>('zitareFavorites').toArray();
			const active = all.filter((f) => !f.deletedAt);
			if (active.length === 0) return null;
			return active[Math.floor(Math.random() * active.length)];
		},
		null as LocalFavorite | null
	);
}

// ─── Picture Queries ────────────────────────────────────────

/** Recent generated images. */
export function useRecentImages(limit = 6) {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalImage>('images').toArray();
		return all
			.filter((i) => !i.isArchived && !i.deletedAt)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
			.slice(0, limit);
	}, [] as LocalImage[]);
}

// ─── Clock Queries ──────────────────────────────────────────

/** Enabled alarms. */
export function useEnabledAlarms() {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalAlarm>('alarms').toArray();
		return all.filter((a) => a.enabled && !a.deletedAt);
	}, [] as LocalAlarm[]);
}

/** Active/running timers. */
export function useActiveTimers() {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalCountdownTimer>('timers').toArray();
		return all.filter((t) => (t.status === 'running' || t.status === 'paused') && !t.deletedAt);
	}, [] as LocalCountdownTimer[]);
}

// ─── Storage Queries ────────────────────────────────────────

interface StorageStats {
	totalFiles: number;
	totalSize: number;
	recentFiles: LocalFile[];
}

/** Storage stats: total files and total size. */
export function useStorageStats() {
	return useLiveQueryWithDefault(
		async (): Promise<StorageStats> => {
			const files = await db.table<LocalFile>('files').toArray();
			const active = files.filter((f) => !f.isDeleted && !f.deletedAt);
			const totalSize = active.reduce((sum, f) => sum + (f.size || 0), 0);
			const recent = active
				.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
				.slice(0, 5);
			return { totalFiles: active.length, totalSize, recentFiles: recent };
		},
		{ totalFiles: 0, totalSize: 0, recentFiles: [] as LocalFile[] }
	);
}

// ─── Mukke Queries ──────────────────────────────────────────

interface MukkeStats {
	totalSongs: number;
	totalPlaylists: number;
	favoriteCount: number;
	recentSongs: LocalSong[];
}

/** Mukke library stats + recent songs. */
export function useMukkeStats() {
	return useLiveQueryWithDefault(
		async (): Promise<MukkeStats> => {
			const songs = await db.table<LocalSong>('songs').toArray();
			const playlists = await db.table<LocalPlaylist>('mukkePlaylists').toArray();
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
		{ totalSongs: 0, totalPlaylists: 0, favoriteCount: 0, recentSongs: [] as LocalSong[] }
	);
}

// ─── Presi Queries ──────────────────────────────────────────

/** Recent presentation decks. */
export function useRecentDecks(limit = 5) {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalPresiDeck>('presiDecks').toArray();
		return all
			.filter((d) => !d.deletedAt)
			.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
			.slice(0, limit);
	}, [] as LocalPresiDeck[]);
}

// ─── Context Queries ────────────────────────────────────────

/** Recent documents + spaces. */
export function useRecentDocuments(limit = 5) {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalDocument>('documents').toArray();
		return all
			.filter((d) => !d.deletedAt)
			.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
			.slice(0, limit);
	}, [] as LocalDocument[]);
}

export function useSpaces() {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalContextSpace>('contextSpaces').toArray();
		return all
			.filter((s) => !s.deletedAt)
			.sort((a, b) => {
				if (a.pinned && !b.pinned) return -1;
				if (!a.pinned && b.pinned) return 1;
				return 0;
			});
	}, [] as LocalContextSpace[]);
}

// ─── Cards Queries ─────────────────────────────────────────

interface CardsProgress {
	totalDecks: number;
	totalCards: number;
	cardsLearned: number;
	dueForReview: number;
	decks: LocalCardDeck[];
}

/** Cards learning progress. */
export function useCardsProgress() {
	return useLiveQueryWithDefault(
		async (): Promise<CardsProgress> => {
			const decks = await db.table<LocalCardDeck>('cardDecks').toArray();
			const cards = await db.table<LocalCard>('cards').toArray();
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
			decks: [] as LocalCardDeck[],
		}
	);
}
