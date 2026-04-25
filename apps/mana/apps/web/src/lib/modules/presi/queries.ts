/**
 * Reactive queries & pure helpers for Presi — uses Dexie liveQuery on the unified DB.
 *
 * Uses prefixed table names: presiDecks, slides.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecord, decryptRecords } from '$lib/data/crypto';
import type { LocalDeck, LocalSlide, Deck, Slide } from './types';

// ─── Type Converters ──────────────────────────────────────

/** Convert LocalDeck (IndexedDB) to shared Deck type. */
export function toDeck(local: LocalDeck): Deck {
	return {
		id: local.id,
		title: local.title,
		description: local.description ?? undefined,
		themeId: local.themeId ?? undefined,
		visibility: local.visibility ?? 'space',
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
	return useScopedLiveQuery(async () => {
		const visible = (
			await scopedForModule<LocalDeck, string>('presi', 'presiDecks').toArray()
		).filter((d) => !d.deletedAt);
		const decrypted = await decryptRecords('presiDecks', visible);
		return decrypted
			.map(toDeck)
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	}, [] as Deck[]);
}

/** Slides for a specific deck, sorted by order. Auto-updates on any change. */
export function useDeckSlides(deckId: string) {
	return useScopedLiveQuery(async () => {
		const visible = (
			await db.table<LocalSlide>('slides').where('deckId').equals(deckId).toArray()
		).filter((s) => !s.deletedAt);
		const decrypted = await decryptRecords('slides', visible);
		return decrypted.map(toSlide).sort((a, b) => a.order - b.order);
	}, [] as Slide[]);
}

/** Single deck by ID. Auto-updates on any change. */
export function useDeck(id: string) {
	return useScopedLiveQuery(
		async () => {
			const local = await db.table<LocalDeck>('presiDecks').get(id);
			if (!local || local.deletedAt) return null;
			const decrypted = await decryptRecord('presiDecks', { ...local });
			return toDeck(decrypted);
		},
		null as Deck | null
	);
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
