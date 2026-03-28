/**
 * Card Store — Mutation-Only Service
 *
 * All reads are handled by useLiveQuery() hooks in queries.ts.
 * This store only provides write operations (create, update, delete, reorder).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import type { Card, CreateCardInput, UpdateCardInput } from '$lib/types/card';
import { cardCollection, deckCollection, type LocalCard } from '$lib/data/local-store';
import { toCard } from '$lib/data/queries';
import { ManaDeckEvents } from '@manacore/shared-utils/analytics';

let error = $state<string | null>(null);

export const cardStore = {
	get error() {
		return error;
	},

	/**
	 * Create new card -- writes to IndexedDB instantly.
	 */
	async createCard(input: CreateCardInput, currentCardCount: number = 0): Promise<Card | null> {
		error = null;
		try {
			const content = input.content as { front?: string; back?: string; text?: string };
			const newLocal: LocalCard = {
				id: crypto.randomUUID(),
				deckId: input.deck_id,
				front: content.front || content.text || input.title || '',
				back: content.back || '',
				difficulty: 1,
				reviewCount: 0,
				order: input.position ?? currentCardCount,
			};

			const inserted = await cardCollection.insert(newLocal);

			// Update deck card count
			const deck = await deckCollection.get(input.deck_id);
			if (deck) {
				await deckCollection.update(input.deck_id, {
					cardCount: (deck.cardCount || 0) + 1,
				});
			}

			ManaDeckEvents.cardCreated();
			return toCard(inserted);
		} catch (err: any) {
			error = err.message || 'Failed to create card';
			console.error('Create card error:', err);
			return null;
		}
	},

	/**
	 * Update card -- writes to IndexedDB instantly.
	 */
	async updateCard(id: string, updates: UpdateCardInput) {
		error = null;
		try {
			const localUpdates: Partial<LocalCard> = {};
			if (updates.content) {
				const content = updates.content as { front?: string; back?: string; text?: string };
				if (content.front !== undefined) localUpdates.front = content.front;
				if (content.back !== undefined) localUpdates.back = content.back;
			}
			if (updates.title !== undefined) localUpdates.front = updates.title;
			if (updates.position !== undefined) localUpdates.order = updates.position;

			await cardCollection.update(id, localUpdates);
		} catch (err: any) {
			error = err.message || 'Failed to update card';
			console.error('Update card error:', err);
		}
	},

	/**
	 * Delete card -- writes to IndexedDB instantly.
	 */
	async deleteCard(id: string, deckId?: string) {
		error = null;
		try {
			await cardCollection.delete(id);

			// Update deck card count
			if (deckId) {
				const deck = await deckCollection.get(deckId);
				if (deck) {
					await deckCollection.update(deckId, {
						cardCount: Math.max(0, (deck.cardCount || 0) - 1),
					});
				}
			}

			ManaDeckEvents.cardDeleted();
		} catch (err: any) {
			error = err.message || 'Failed to delete card';
			console.error('Delete card error:', err);
		}
	},

	/**
	 * Reorder cards -- writes to IndexedDB instantly.
	 */
	async reorderCards(deckId: string, cardIds: string[]) {
		error = null;
		try {
			for (let i = 0; i < cardIds.length; i++) {
				await cardCollection.update(cardIds[i], { order: i } as Partial<LocalCard>);
			}
		} catch (err: any) {
			error = err.message || 'Failed to reorder cards';
			console.error('Reorder cards error:', err);
		}
	},

	/**
	 * Clear error
	 */
	clearError() {
		error = null;
	},
};
