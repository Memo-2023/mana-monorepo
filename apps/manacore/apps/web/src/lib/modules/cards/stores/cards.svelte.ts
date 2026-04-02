/**
 * Card Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store only handles writes to IndexedDB via the unified database.
 */

import { CardsEvents } from '@manacore/shared-utils/analytics';
import { cardTable, cardDeckTable } from '../collections';
import { toCard } from '../queries';
import type { LocalCard, Card, CreateCardInput, UpdateCardInput } from '../types';

let error = $state<string | null>(null);

export const cardStore = {
	get error() {
		return error;
	},

	async createCard(input: CreateCardInput, currentCardCount: number = 0): Promise<Card | null> {
		error = null;
		try {
			const newLocal: LocalCard = {
				id: crypto.randomUUID(),
				deckId: input.deckId,
				front: input.front,
				back: input.back,
				difficulty: 1,
				reviewCount: 0,
				order: currentCardCount,
			};

			await cardTable.add(newLocal);

			// Update deck card count
			const deck = await cardDeckTable.get(input.deckId);
			if (deck) {
				await cardDeckTable.update(input.deckId, {
					cardCount: (deck.cardCount || 0) + 1,
					updatedAt: new Date().toISOString(),
				});
			}

			CardsEvents.cardCreated();
			return toCard(newLocal);
		} catch (err: any) {
			error = err.message || 'Failed to create card';
			console.error('Create card error:', err);
			return null;
		}
	},

	async updateCard(id: string, updates: UpdateCardInput) {
		error = null;
		try {
			const localUpdates: Partial<LocalCard> = {};
			if (updates.front !== undefined) localUpdates.front = updates.front;
			if (updates.back !== undefined) localUpdates.back = updates.back;
			if (updates.difficulty !== undefined) localUpdates.difficulty = updates.difficulty;
			if (updates.order !== undefined) localUpdates.order = updates.order;

			await cardTable.update(id, {
				...localUpdates,
				updatedAt: new Date().toISOString(),
			});
		} catch (err: any) {
			error = err.message || 'Failed to update card';
			console.error('Update card error:', err);
		}
	},

	async deleteCard(id: string, deckId?: string) {
		error = null;
		try {
			const now = new Date().toISOString();
			await cardTable.update(id, { deletedAt: now, updatedAt: now });
			CardsEvents.cardDeleted();

			// Update deck card count
			if (deckId) {
				const deck = await cardDeckTable.get(deckId);
				if (deck) {
					await cardDeckTable.update(deckId, {
						cardCount: Math.max(0, (deck.cardCount || 0) - 1),
						updatedAt: now,
					});
				}
			}
		} catch (err: any) {
			error = err.message || 'Failed to delete card';
			console.error('Delete card error:', err);
		}
	},

	async reorderCards(cardIds: string[]) {
		error = null;
		try {
			const now = new Date().toISOString();
			for (let i = 0; i < cardIds.length; i++) {
				await cardTable.update(cardIds[i], { order: i, updatedAt: now });
			}
		} catch (err: any) {
			error = err.message || 'Failed to reorder cards';
			console.error('Reorder cards error:', err);
		}
	},

	clearError() {
		error = null;
	},
};
