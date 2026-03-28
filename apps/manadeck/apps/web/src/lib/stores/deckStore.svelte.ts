/**
 * Deck Store — Mutation-Only Service
 *
 * All reads are handled by useLiveQuery() hooks in queries.ts.
 * This store only provides write operations (create, update, delete).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import type { CreateDeckInput, UpdateDeckInput } from '$lib/types/deck';
import { deckCollection, cardCollection, type LocalDeck } from '$lib/data/local-store';
import { toDeck } from '$lib/data/queries';
import { ManaDeckEvents } from '@manacore/shared-utils/analytics';
import type { Deck } from '$lib/types/deck';

let error = $state<string | null>(null);

export const deckStore = {
	get error() {
		return error;
	},

	/**
	 * Create new deck -- writes to IndexedDB instantly.
	 */
	async createDeck(input: CreateDeckInput): Promise<Deck | null> {
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
			ManaDeckEvents.deckCreated();
			return toDeck(inserted);
		} catch (err: any) {
			error = err.message || 'Failed to create deck';
			console.error('Create deck error:', err);
			return null;
		}
	},

	/**
	 * Update deck -- writes to IndexedDB instantly.
	 */
	async updateDeck(id: string, updates: UpdateDeckInput) {
		error = null;
		try {
			const localUpdates: Partial<LocalDeck> = {};
			if (updates.title !== undefined) localUpdates.name = updates.title;
			if (updates.description !== undefined) localUpdates.description = updates.description;
			if (updates.is_public !== undefined) localUpdates.isPublic = updates.is_public;

			await deckCollection.update(id, localUpdates);
		} catch (err: any) {
			error = err.message || 'Failed to update deck';
			console.error('Update deck error:', err);
		}
	},

	/**
	 * Delete deck -- writes to IndexedDB instantly.
	 */
	async deleteDeck(id: string) {
		error = null;
		try {
			// Delete all cards belonging to this deck
			const cards = await cardCollection.getAll({ deckId: id });
			for (const card of cards) {
				await cardCollection.delete(card.id);
			}

			await deckCollection.delete(id);
			ManaDeckEvents.deckDeleted();
		} catch (err: any) {
			error = err.message || 'Failed to delete deck';
			console.error('Delete deck error:', err);
		}
	},

	/**
	 * Clear error
	 */
	clearError() {
		error = null;
	},
};
