/**
 * Deck Store — Local-First with Dexie.js
 *
 * All reads and writes go to IndexedDB first.
 * When authenticated, changes sync to the server in the background.
 * Same public API as before so components don't need changes.
 */

import type { Deck, CreateDeckInput, UpdateDeckInput } from '$lib/types/deck';
import { deckCollection, cardCollection, type LocalDeck } from '$lib/data/local-store';
import { ManaDeckEvents } from '@manacore/shared-utils/analytics';

// Svelte 5 runes-based deck store
let decks = $state<Deck[]>([]);
let currentDeck = $state<Deck | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);

/** Convert a LocalDeck (IndexedDB record) to the shared Deck type. */
function toDeck(local: LocalDeck): Deck {
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

export const deckStore = {
	get decks() {
		return decks;
	},
	get currentDeck() {
		return currentDeck;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Fetch all decks for current user — reads from IndexedDB.
	 */
	async fetchDecks() {
		loading = true;
		error = null;

		try {
			const localDecks = await deckCollection.getAll();
			decks = localDecks.map(toDeck);
		} catch (err: any) {
			error = err.message || 'Failed to fetch decks';
			console.error('Fetch decks error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Fetch single deck by ID — reads from IndexedDB.
	 */
	async fetchDeck(id: string) {
		loading = true;
		error = null;

		try {
			const localDeck = await deckCollection.get(id);
			if (localDeck) {
				currentDeck = toDeck(localDeck);
			} else {
				currentDeck = null;
				throw new Error('Deck not found');
			}
		} catch (err: any) {
			error = err.message || 'Failed to fetch deck';
			console.error('Fetch deck error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Create new deck — writes to IndexedDB instantly.
	 */
	async createDeck(input: CreateDeckInput): Promise<Deck | null> {
		loading = true;
		error = null;

		try {
			const newLocal: LocalDeck = {
				id: crypto.randomUUID(),
				name: input.title,
				description: input.description || null,
				color: '#6366f1',
				cardCount: 0,
				isPublic: input.is_public ?? false,
			};

			const inserted = await deckCollection.insert(newLocal);
			const deck = toDeck(inserted);
			decks = [deck, ...decks];
			ManaDeckEvents.deckCreated();
			return deck;
		} catch (err: any) {
			error = err.message || 'Failed to create deck';
			console.error('Create deck error:', err);
			return null;
		} finally {
			loading = false;
		}
	},

	/**
	 * Update deck — writes to IndexedDB instantly.
	 */
	async updateDeck(id: string, updates: UpdateDeckInput) {
		loading = true;
		error = null;

		try {
			const localUpdates: Partial<LocalDeck> = {};
			if (updates.title !== undefined) localUpdates.name = updates.title;
			if (updates.description !== undefined) localUpdates.description = updates.description;
			if (updates.is_public !== undefined) localUpdates.isPublic = updates.is_public;

			const updated = await deckCollection.update(id, localUpdates);
			if (updated) {
				const updatedDeck = toDeck(updated);
				decks = decks.map((d) => (d.id === id ? updatedDeck : d));

				if (currentDeck?.id === id) {
					currentDeck = updatedDeck;
				}
			}
		} catch (err: any) {
			error = err.message || 'Failed to update deck';
			console.error('Update deck error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Delete deck — writes to IndexedDB instantly.
	 */
	async deleteDeck(id: string) {
		loading = true;
		error = null;

		try {
			// Delete all cards belonging to this deck
			const cards = await cardCollection.getAll({ deckId: id });
			for (const card of cards) {
				await cardCollection.delete(card.id);
			}

			await deckCollection.delete(id);
			decks = decks.filter((d) => d.id !== id);
			ManaDeckEvents.deckDeleted();

			if (currentDeck?.id === id) {
				currentDeck = null;
			}
		} catch (err: any) {
			error = err.message || 'Failed to delete deck';
			console.error('Delete deck error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Clear error
	 */
	clearError() {
		error = null;
	},

	/**
	 * Clear all state
	 */
	clear() {
		decks = [];
		currentDeck = null;
		loading = false;
		error = null;
	},
};
