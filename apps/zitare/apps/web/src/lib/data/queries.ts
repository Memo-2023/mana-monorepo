/**
 * Reactive Queries & Pure Helpers for Zitare
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	favoriteCollection,
	listCollection,
	type LocalFavorite,
	type LocalQuoteList,
} from './local-store';

// ─── Domain Types ─────────────────────────────────────────

export interface Favorite {
	id: string;
	quoteId: string;
	createdAt: string;
}

export interface QuoteList {
	id: string;
	name: string;
	description?: string;
	quoteIds: string[];
	createdAt: string;
	updatedAt: string;
}

// ─── Type Converters ──────────────────────────────────────

export function toFavorite(local: LocalFavorite): Favorite {
	return {
		id: local.id,
		quoteId: local.quoteId,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

export function toQuoteList(local: LocalQuoteList): QuoteList {
	return {
		id: local.id,
		name: local.name,
		description: local.description ?? undefined,
		quoteIds: local.quoteIds,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Query Hooks (call during component init) ────────

/** All favorites. Auto-updates on any change. */
export function useAllFavorites() {
	return useLiveQueryWithDefault(async () => {
		const locals = await favoriteCollection.getAll();
		return locals.map(toFavorite);
	}, [] as Favorite[]);
}

/** All lists. Auto-updates on any change. */
export function useAllLists() {
	return useLiveQueryWithDefault(async () => {
		const locals = await listCollection.getAll();
		return locals.map(toQuoteList);
	}, [] as QuoteList[]);
}

// ─── Pure Helper Functions (for $derived) ─────────────────

/** Check if a quote is in the favorites list. */
export function isFavorite(favorites: Favorite[], quoteId: string): boolean {
	return favorites.some((f) => f.quoteId === quoteId);
}

/** Find a favorite by quote ID. */
export function findFavoriteByQuoteId(
	favorites: Favorite[],
	quoteId: string
): Favorite | undefined {
	return favorites.find((f) => f.quoteId === quoteId);
}

/** Find a list by ID. */
export function findListById(lists: QuoteList[], listId: string): QuoteList | undefined {
	return lists.find((l) => l.id === listId);
}
