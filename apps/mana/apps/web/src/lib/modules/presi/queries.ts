/**
 * Reactive queries & pure helpers for Presi — uses Dexie liveQuery on the unified DB.
 *
 * Uses prefixed table names: presiDecks, slides.
 */

import { liveQuery } from 'dexie';
import { db } from '$lib/data/database';
import type { LocalDeck, LocalSlide, Deck, Slide } from './types';

// ─── Type Converters ──────────────────────────────────────

/** Convert LocalDeck (IndexedDB) to shared Deck type. */
export function toDeck(local: LocalDeck): Deck {
	return {
		id: local.id,
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

// ─── Live Queries ─────────────────────────────────────────

/** All decks, sorted by updatedAt descending. Auto-updates on any change. */
export function useAllDecks() {
	return liveQuery(async () => {
		const locals = await db.table<LocalDeck>('presiDecks').toArray();
		return locals
			.filter((d) => !d.deletedAt)
			.map(toDeck)
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	});
}

/** Slides for a specific deck, sorted by order. Auto-updates on any change. */
export function useDeckSlides(deckId: string) {
	return liveQuery(async () => {
		const locals = await db.table<LocalSlide>('slides').where('deckId').equals(deckId).toArray();
		return locals
			.filter((s) => !s.deletedAt)
			.map(toSlide)
			.sort((a, b) => a.order - b.order);
	});
}

/** Single deck by ID. Auto-updates on any change. */
export function useDeck(id: string) {
	return liveQuery(async () => {
		const local = await db.table<LocalDeck>('presiDecks').get(id);
		if (!local || local.deletedAt) return null;
		return toDeck(local);
	});
}

// ─── Pure Helper Functions ────────────────────────────────

/** Find a deck by ID from a list. */
export function findDeckById(decks: Deck[], id: string): Deck | undefined {
	return decks.find((d) => d.id === id);
}

/** Get slide count for a deck. */
export function getSlideCount(slides: Slide[], deckId: string): number {
	return slides.filter((s) => s.deckId === deckId).length;
}
