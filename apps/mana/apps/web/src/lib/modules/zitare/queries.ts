/**
 * Reactive queries for Zitare — uses Dexie liveQuery on the unified DB.
 */

import { liveQuery } from 'dexie';
import { db } from '$lib/data/database';
import type { LocalFavorite, LocalQuoteList, LocalCustomQuote } from './types';

// ─── Domain Types ─────────────────────────────────────────

export interface Favorite {
	id: string;
	quoteId: string;
	notes?: string;
	createdAt: string;
}

export interface CustomQuote {
	id: string;
	text: string;
	author: string;
	category?: string;
	source?: string;
	year?: number;
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
		notes: local.notes ?? undefined,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

export function toCustomQuote(local: LocalCustomQuote): CustomQuote {
	return {
		id: local.id,
		text: local.text,
		author: local.author,
		category: local.category ?? undefined,
		source: local.source ?? undefined,
		year: local.year ?? undefined,
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

/** All custom quotes. Auto-updates on any change. */
export function useAllCustomQuotes() {
	return liveQuery(async () => {
		const locals = await db.table<LocalCustomQuote>('zitareCustomQuotes').toArray();
		return locals.filter((q) => !q.deletedAt).map(toCustomQuote);
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
