/**
 * Reactive Queries & Pure Helpers for Presi
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQuery, useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import type { Deck, Slide } from '@presi/shared';
import { deckCollection, slideCollection, type LocalDeck, type LocalSlide } from './local-store';

// ─── Type Converters ──────────────────────────────────────

/** Convert LocalDeck (IndexedDB) to shared Deck type. */
export function toDeck(local: LocalDeck): Deck {
	return {
		id: local.id,
		userId: 'local',
		title: local.title,
		description: local.description ?? undefined,
		themeId: local.themeId ?? undefined,
		isPublic: local.isPublic,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Convert LocalSlide (IndexedDB) to shared Slide type. */
export function toSlide(local: LocalSlide): Slide {
	return {
		id: local.id,
		deckId: local.deckId,
		order: local.order,
		content: local.content,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

// ─── Live Query Hooks (call during component init) ────────

/** All decks, sorted by updatedAt descending. Auto-updates on any change. */
export function useAllDecks() {
	return useLiveQueryWithDefault(async () => {
		const locals = await deckCollection.getAll();
		return locals
			.map(toDeck)
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	}, [] as Deck[]);
}

/** Slides for a specific deck, sorted by order. Auto-updates on any change. */
export function useDeckSlides(deckId: string) {
	return useLiveQueryWithDefault(async () => {
		const locals = await slideCollection.getAll({ deckId });
		return locals.map(toSlide).sort((a, b) => a.order - b.order);
	}, [] as Slide[]);
}

/** Single deck by ID. Has loading state. Auto-updates on any change. */
export function useDeck(id: string) {
	return useLiveQuery(async () => {
		const local = await deckCollection.get(id);
		return local ? toDeck(local) : null;
	});
}

// ─── Pure Helper Functions (for $derived) ─────────────────

/** Find a deck by ID from a list. */
export function findDeckById(decks: Deck[], id: string): Deck | undefined {
	return decks.find((d) => d.id === id);
}
