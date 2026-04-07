/**
 * Deck Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store only handles writes to IndexedDB via the unified database.
 */

import { CardsEvents } from '@mana/shared-utils/analytics';
import { db } from '$lib/data/database';
import { cardDeckTable, cardTable } from '../collections';
import { toDeck } from '../queries';
import { encryptRecord } from '$lib/data/crypto';
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

			const plaintextSnapshot = toDeck(newLocal);
			await encryptRecord('cardDecks', newLocal);
			await cardDeckTable.add(newLocal);
			CardsEvents.deckCreated();
			return plaintextSnapshot;
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

			const diff: Partial<LocalDeck> = {
				...localUpdates,
				updatedAt: new Date().toISOString(),
			};
			await encryptRecord('cardDecks', diff);
			await cardDeckTable.update(id, diff);
		} catch (err: any) {
			error = err.message || 'Failed to update deck';
			console.error('Update deck error:', err);
		}
	},

	async deleteDeck(id: string) {
		error = null;
		try {
			const now = new Date().toISOString();

			// Atomic cascade: deck + all child cards are soft-deleted in one
			// Dexie transaction. If any write fails, the whole operation aborts —
			// no orphaned cards left pointing at a deleted deck.
			await db.transaction('rw', cardDeckTable, cardTable, async () => {
				const cards = await cardTable.where('deckId').equals(id).toArray();
				for (const card of cards) {
					await cardTable.update(card.id, { deletedAt: now, updatedAt: now });
				}
				await cardDeckTable.update(id, { deletedAt: now, updatedAt: now });
			});
			CardsEvents.deckDeleted();
		} catch (err: any) {
			error = err.message || 'Failed to delete deck';
			console.error('Delete deck error:', err);
		}
	},

	clearError() {
		error = null;
	},
};
