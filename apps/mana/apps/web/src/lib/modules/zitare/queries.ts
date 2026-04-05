/**
 * Reactive queries for Zitare — uses Dexie liveQuery on the unified DB.
 */

import { liveQuery } from 'dexie';
import { db } from '$lib/data/database';
import type { LocalFavorite, LocalQuoteList } from './types';

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

// ─── Live Queries ─────────────────────────────────────────

/** All favorites. Auto-updates on any change. */
export function useAllFavorites() {
	return liveQuery(async () => {
		const locals = await db.table<LocalFavorite>('zitareFavorites').toArray();
		return locals.filter((f) => !f.deletedAt).map(toFavorite);
	});
}

/** All lists. Auto-updates on any change. */
export function useAllLists() {
	return liveQuery(async () => {
		const locals = await db.table<LocalQuoteList>('zitareLists').toArray();
		return locals.filter((l) => !l.deletedAt).map(toQuoteList);
	});
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
