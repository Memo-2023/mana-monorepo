/**
 * Presi — Local-First Data Layer
 *
 * Defines the IndexedDB database, collections, and guest seed data.
 * This is the single source of truth for all Presi data.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestDecks, guestSlides } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalDeck extends BaseRecord {
	title: string;
	description?: string | null;
	themeId?: string | null;
	isPublic: boolean;
}

export interface LocalSlide extends BaseRecord {
	deckId: string;
	order: number;
	content: {
		type: 'title' | 'content' | 'image' | 'split';
		title?: string;
		subtitle?: string;
		body?: string;
		imageUrl?: string;
		bulletPoints?: string[];
	};
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const presiStore = createLocalStore({
	appId: 'presi',
	collections: [
		{
			name: 'decks',
			indexes: ['isPublic'],
			guestSeed: guestDecks,
		},
		{
			name: 'slides',
			indexes: ['deckId', 'order', '[deckId+order]'],
			guestSeed: guestSlides,
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const deckCollection = presiStore.collection<LocalDeck>('decks');
export const slideCollection = presiStore.collection<LocalSlide>('slides');
