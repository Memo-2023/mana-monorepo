/**
 * Cards — Local-First Data Layer
 *
 * Defines the IndexedDB database, collections, and guest seed data.
 * This is the single source of truth for all Cards data.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestDecks, guestCards } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalDeck extends BaseRecord {
	name: string;
	description?: string | null;
	color: string;
	cardCount: number;
	lastStudied?: string | null;
	isPublic: boolean;
}

export interface LocalCard extends BaseRecord {
	deckId: string;
	front: string;
	back: string;
	difficulty: number; // 1-5
	nextReview?: string | null;
	reviewCount: number;
	order: number;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const cardsStore = createLocalStore({
	appId: 'cards',
	collections: [
		{
			name: 'decks',
			indexes: ['isPublic'],
			guestSeed: guestDecks,
		},
		{
			name: 'cards',
			indexes: ['deckId', 'difficulty', 'nextReview', 'order', '[deckId+order]'],
			guestSeed: guestCards,
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const deckCollection = cardsStore.collection<LocalDeck>('decks');
export const cardCollection = cardsStore.collection<LocalCard>('cards');
