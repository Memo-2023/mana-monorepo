/**
 * Card Store — Local-First with Dexie.js
 *
 * All reads and writes go to IndexedDB first.
 * When authenticated, changes sync to the server in the background.
 * Same public API as before so components don't need changes.
 */

import type { Card, CreateCardInput, UpdateCardInput } from '$lib/types/card';
import { cardCollection, deckCollection, type LocalCard } from '$lib/data/local-store';
import { ManaDeckEvents } from '@manacore/shared-utils/analytics';

// Svelte 5 runes-based card store
let cards = $state<Card[]>([]);
let currentCard = $state<Card | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);

/** Convert a LocalCard (IndexedDB record) to the shared Card type. */
function toCard(local: LocalCard): Card {
	return {
		id: local.id,
		deck_id: local.deckId,
		position: local.order,
		title: local.front,
		content: {
			front: local.front,
			back: local.back,
		},
		card_type: 'flashcard',
		version: 1,
		is_favorite: false,
		created_at: local.createdAt ?? new Date().toISOString(),
		updated_at: local.updatedAt ?? new Date().toISOString(),
	};
}

export const cardStore = {
	get cards() {
		return cards;
	},
	get currentCard() {
		return currentCard;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Fetch all cards for a deck — reads from IndexedDB.
	 */
	async fetchCards(deckId: string) {
		loading = true;
		error = null;

		try {
			const localCards = await cardCollection.getAll(
				{ deckId },
				{ sortBy: 'order', sortDirection: 'asc' }
			);
			cards = localCards.map(toCard);
		} catch (err: any) {
			error = err.message || 'Failed to fetch cards';
			console.error('Fetch cards error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Fetch single card by ID — reads from IndexedDB.
	 */
	async fetchCard(id: string) {
		loading = true;
		error = null;

		try {
			const localCard = await cardCollection.get(id);
			currentCard = localCard ? toCard(localCard) : null;
		} catch (err: any) {
			error = err.message || 'Failed to fetch card';
			console.error('Fetch card error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Create new card — writes to IndexedDB instantly.
	 */
	async createCard(input: CreateCardInput): Promise<Card | null> {
		loading = true;
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
				order: input.position ?? cards.length,
			};

			const inserted = await cardCollection.insert(newLocal);
			const card = toCard(inserted);
			cards = [...cards, card];

			// Update deck card count
			const deck = await deckCollection.get(input.deck_id);
			if (deck) {
				await deckCollection.update(input.deck_id, {
					cardCount: (deck.cardCount || 0) + 1,
				});
			}

			ManaDeckEvents.cardCreated();
			return card;
		} catch (err: any) {
			error = err.message || 'Failed to create card';
			console.error('Create card error:', err);
			return null;
		} finally {
			loading = false;
		}
	},

	/**
	 * Update card — writes to IndexedDB instantly.
	 */
	async updateCard(id: string, updates: UpdateCardInput) {
		loading = true;
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

			const updated = await cardCollection.update(id, localUpdates);
			if (updated) {
				const updatedCard = toCard(updated);
				cards = cards.map((c) => (c.id === id ? updatedCard : c));

				if (currentCard?.id === id) {
					currentCard = updatedCard;
				}
			}
		} catch (err: any) {
			error = err.message || 'Failed to update card';
			console.error('Update card error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Delete card — writes to IndexedDB instantly.
	 */
	async deleteCard(id: string) {
		loading = true;
		error = null;

		try {
			// Find the card to get its deckId before deleting
			const card = cards.find((c) => c.id === id);
			await cardCollection.delete(id);
			cards = cards.filter((c) => c.id !== id);

			// Update deck card count
			if (card) {
				const deck = await deckCollection.get(card.deck_id);
				if (deck) {
					await deckCollection.update(card.deck_id, {
						cardCount: Math.max(0, (deck.cardCount || 0) - 1),
					});
				}
			}

			ManaDeckEvents.cardDeleted();

			if (currentCard?.id === id) {
				currentCard = null;
			}
		} catch (err: any) {
			error = err.message || 'Failed to delete card';
			console.error('Delete card error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Reorder cards — writes to IndexedDB instantly.
	 */
	async reorderCards(deckId: string, cardIds: string[]) {
		loading = true;
		error = null;

		try {
			// Update local positions
			cards = cardIds
				.map((id, index) => {
					const card = cards.find((c) => c.id === id);
					return card ? { ...card, position: index } : card!;
				})
				.filter(Boolean);

			// Persist each order change to IndexedDB
			for (let i = 0; i < cardIds.length; i++) {
				await cardCollection.update(cardIds[i], { order: i } as Partial<LocalCard>);
			}
		} catch (err: any) {
			error = err.message || 'Failed to reorder cards';
			console.error('Reorder cards error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Clear cards (when changing decks)
	 */
	clearCards() {
		cards = [];
		currentCard = null;
		error = null;
	},

	/**
	 * Clear error
	 */
	clearError() {
		error = null;
	},
};
