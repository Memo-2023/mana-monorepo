import type { Card, CreateCardInput, UpdateCardInput } from '$lib/types/card';
import { PUBLIC_API_URL } from '$env/static/public';
import { authService } from '$lib/auth';

// Svelte 5 runes-based card store
let cards = $state<Card[]>([]);
let currentCard = $state<Card | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);

/**
 * Helper to make authenticated API requests
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const appToken = await authService.getAppToken();
	if (!appToken) {
		throw new Error('Not authenticated');
	}

	const response = await fetch(`${PUBLIC_API_URL}${endpoint}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${appToken}`,
			...options.headers
		}
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.message || `API error: ${response.status}`);
	}

	return response.json();
}

/**
 * Map backend camelCase to frontend snake_case
 */
function mapCardFromApi(apiCard: any): Card {
	return {
		id: apiCard.id,
		deck_id: apiCard.deckId,
		position: apiCard.position,
		title: apiCard.title,
		content: apiCard.content,
		card_type: apiCard.cardType,
		ai_model: apiCard.aiModel,
		ai_prompt: apiCard.aiPrompt,
		version: apiCard.version || 1,
		is_favorite: apiCard.isFavorite || false,
		created_at: apiCard.createdAt,
		updated_at: apiCard.updatedAt
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
	 * Fetch all cards for a deck
	 */
	async fetchCards(deckId: string) {
		loading = true;
		error = null;

		try {
			const response = await apiRequest<{ cards: any[]; count: number }>(
				`/v1/api/decks/${deckId}/cards`
			);
			cards = (response.cards || []).map(mapCardFromApi);
		} catch (err: any) {
			error = err.message || 'Failed to fetch cards';
			console.error('Fetch cards error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Fetch single card by ID
	 */
	async fetchCard(id: string) {
		loading = true;
		error = null;

		try {
			const response = await apiRequest<{ card: any }>(`/v1/api/cards/${id}`);
			currentCard = response.card ? mapCardFromApi(response.card) : null;
		} catch (err: any) {
			error = err.message || 'Failed to fetch card';
			console.error('Fetch card error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Create new card
	 */
	async createCard(input: CreateCardInput): Promise<Card | null> {
		loading = true;
		error = null;

		try {
			const response = await apiRequest<{ success: boolean; card: any }>('/v1/api/cards', {
				method: 'POST',
				body: JSON.stringify({
					deckId: input.deck_id,
					title: input.title,
					content: input.content,
					cardType: input.card_type,
					position: input.position
				})
			});

			if (response.card) {
				const card = mapCardFromApi(response.card);
				cards = [...cards, card];
				return card;
			}
			return null;
		} catch (err: any) {
			error = err.message || 'Failed to create card';
			console.error('Create card error:', err);
			return null;
		} finally {
			loading = false;
		}
	},

	/**
	 * Update card
	 */
	async updateCard(id: string, updates: UpdateCardInput) {
		loading = true;
		error = null;

		try {
			const response = await apiRequest<{ success: boolean; card: any }>(`/v1/api/cards/${id}`, {
				method: 'PUT',
				body: JSON.stringify({
					title: updates.title,
					content: updates.content,
					cardType: updates.card_type,
					position: updates.position,
					isFavorite: updates.is_favorite
				})
			});

			if (response.card) {
				const updatedCard = mapCardFromApi(response.card);
				// Update in list
				cards = cards.map((c) => (c.id === id ? updatedCard : c));

				// Update current if it's the same
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
	 * Delete card
	 */
	async deleteCard(id: string) {
		loading = true;
		error = null;

		try {
			await apiRequest<{ success: boolean }>(`/v1/api/cards/${id}`, {
				method: 'DELETE'
			});

			// Remove from list
			cards = cards.filter((c) => c.id !== id);

			// Clear current if it's the same
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
	 * Reorder cards
	 */
	async reorderCards(deckId: string, cardIds: string[]) {
		loading = true;
		error = null;

		try {
			await apiRequest<{ success: boolean }>('/v1/api/cards/reorder', {
				method: 'POST',
				body: JSON.stringify({ deckId, cardIds })
			});

			// Update local positions
			cards = cardIds.map((id, index) => {
				const card = cards.find((c) => c.id === id);
				return card ? { ...card, position: index } : card!;
			}).filter(Boolean);
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
	}
};
