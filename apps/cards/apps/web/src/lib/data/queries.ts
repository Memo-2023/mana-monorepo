/**
 * Reactive Queries & Pure Helpers for Cards
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import { deckCollection, cardCollection, type LocalDeck, type LocalCard } from './local-store';
import type { Deck } from '$lib/types/deck';
import type { Card } from '$lib/types/card';

// ─── Type Converters ───────────────────────────────────────

export function toDeck(local: LocalDeck): Deck {
	return {
		id: local.id,
		user_id: 'guest',
		title: local.name,
		description: local.description ?? undefined,
		is_public: local.isPublic,
		settings: {},
		tags: [],
		metadata: {},
		created_at: local.createdAt ?? new Date().toISOString(),
		updated_at: local.updatedAt ?? new Date().toISOString(),
		card_count: local.cardCount,
	};
}

export function toCard(local: LocalCard): Card {
	return {
		id: local.id,
		deck_id: local.deckId,
		position: local.order,
		title: local.front,
		content: {
			front: local.front,
			back: local.back,
		},
		card_type: 'flashcard',
		version: 1,
		is_favorite: false,
		created_at: local.createdAt ?? new Date().toISOString(),
		updated_at: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Query Hooks (call during component init) ─────────

/** All decks, auto-updates on any change. */
export function useAllDecks() {
	return useLiveQueryWithDefault(async () => {
		const locals = await deckCollection.getAll();
		return locals.map(toDeck);
	}, [] as Deck[]);
}

/** All cards for a specific deck, sorted by order. Auto-updates on any change. */
export function useCardsByDeck(deckId: string) {
	return useLiveQueryWithDefault(async () => {
		const locals = await cardCollection.getAll(
			{ deckId },
			{ sortBy: 'order', sortDirection: 'asc' }
		);
		return locals.map(toCard);
	}, [] as Card[]);
}

/** Single deck by ID. Auto-updates on any change. */
export function useDeck(deckId: string) {
	return useLiveQueryWithDefault(
		async () => {
			const local = await deckCollection.get(deckId);
			return local ? toDeck(local) : null;
		},
		null as Deck | null
	);
}

// ─── Pure Helper Functions ─────────────────────────────────

export function getDeckById(decks: Deck[], id: string): Deck | undefined {
	return decks.find((d) => d.id === id);
}

export function getPublicDecks(decks: Deck[]): Deck[] {
	return decks.filter((d) => d.is_public);
}
