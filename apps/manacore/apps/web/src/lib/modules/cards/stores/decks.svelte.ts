/**
 * Deck Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store only handles writes to IndexedDB via the unified database.
 */

import { cardDeckTable, cardTable } from '../collections';
import { toDeck } from '../queries';
import type { LocalDeck } from '../types';
import type { Deck, CreateDeckInput, UpdateDeckInput } from '../types';

let error = $state<string | null>(null);

export const deckStore = {
	get error() {
		return error;
	},

	async createDeck(input: CreateDeckInput): Promise<Deck | null> {
		error = null;
		try {
			const newLocal: LocalDeck = {
				id: crypto.randomUUID(),
				name: input.title,
				description: input.description ?? null,
				color: '#6366f1',
				cardCount: 0,
				isPublic: input.isPublic ?? false,
			};

			await cardDeckTable.add(newLocal);
			return toDeck(newLocal);
		} catch (err: any) {
			error = err.message || 'Failed to create deck';
			console.error('Create deck error:', err);
			return null;
		}
	},

	async updateDeck(id: string, updates: UpdateDeckInput) {
		error = null;
		try {
			const localUpdates: Partial<LocalDeck> = {};
			if (updates.title !== undefined) localUpdates.name = updates.title;
			if (updates.description !== undefined) localUpdates.description = updates.description;
			if (updates.isPublic !== undefined) localUpdates.isPublic = updates.isPublic;

			await cardDeckTable.update(id, {
				...localUpdates,
				updatedAt: new Date().toISOString(),
			});
		} catch (err: any) {
			error = err.message || 'Failed to update deck';
			console.error('Update deck error:', err);
		}
	},

	async deleteDeck(id: string) {
		error = null;
		try {
			const now = new Date().toISOString();

			// Soft-delete all cards belonging to this deck
			const cards = await cardTable.where('deckId').equals(id).toArray();
			for (const card of cards) {
				await cardTable.update(card.id, { deletedAt: now, updatedAt: now });
			}

			// Soft-delete the deck
			await cardDeckTable.update(id, { deletedAt: now, updatedAt: now });
		} catch (err: any) {
			error = err.message || 'Failed to delete deck';
			console.error('Delete deck error:', err);
		}
	},

	clearError() {
		error = null;
	},
};
