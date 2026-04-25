/**
 * Reactive queries & pure helpers for Cards — uses Dexie liveQuery on the unified DB.
 *
 * Uses table names: cardDecks, cards.
 */

import { liveQuery } from 'dexie';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecord, decryptRecords } from '$lib/data/crypto';
import type { LocalDeck, LocalCard, Deck, Card } from './types';

// ─── Type Converters ───────────────────────────────────────

export function toDeck(local: LocalDeck): Deck {
	return {
		id: local.id,
		title: local.name,
		description: local.description ?? undefined,
		color: local.color,
		visibility: local.visibility ?? 'space',
		tags: [],
		cardCount: local.cardCount,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toCard(local: LocalCard): Card {
	return {
		id: local.id,
		deckId: local.deckId,
		front: local.front,
		back: local.back,
		difficulty: local.difficulty,
		nextReview: local.nextReview ?? undefined,
		reviewCount: local.reviewCount,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

/** All decks, auto-updates on any change. */
export function useAllDecks() {
	return liveQuery(async () => {
		const visible = (
			await scopedForModule<LocalDeck, string>('cards', 'cardDecks').toArray()
		).filter((d) => !d.deletedAt);
		const decrypted = await decryptRecords('cardDecks', visible);
		return decrypted.map(toDeck);
	});
}

/** Single deck by ID. Auto-updates on any change. */
export function useDeck(deckId: string) {
	return liveQuery(async () => {
		const local = await db.table<LocalDeck>('cardDecks').get(deckId);
		if (!local || local.deletedAt) return null;
		const decrypted = await decryptRecord('cardDecks', { ...local });
		return toDeck(decrypted);
	});
}

/** All cards for a specific deck, sorted by order. Auto-updates on any change. */
export function useCardsByDeck(deckId: string) {
	return liveQuery(async () => {
		const visible = (
			await db.table<LocalCard>('cards').where('deckId').equals(deckId).sortBy('order')
		).filter((c) => !c.deletedAt);
		const decrypted = await decryptRecords('cards', visible);
		return decrypted.map(toCard);
	});
}

// ─── Pure Helper Functions ─────────────────────────────────

export function getDeckById(decks: Deck[], id: string): Deck | undefined {
	return decks.find((d) => d.id === id);
}

export function getPublicDecks(decks: Deck[]): Deck[] {
	return decks.filter((d) => d.visibility === 'public');
}

export function getCardCountForDeck(cards: Card[], deckId: string): number {
	return cards.filter((c) => c.deckId === deckId).length;
}

export function getDueCards(cards: Card[]): Card[] {
	const now = new Date().toISOString();
	return cards.filter((c) => c.nextReview && c.nextReview <= now);
}
