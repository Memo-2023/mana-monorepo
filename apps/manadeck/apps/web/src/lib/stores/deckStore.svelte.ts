import type { Deck, CreateDeckInput, UpdateDeckInput } from '$lib/types/deck';
import { PUBLIC_API_URL } from '$env/static/public';
import { authService } from '$lib/auth';

// Svelte 5 runes-based deck store
let decks = $state<Deck[]>([]);
let currentDeck = $state<Deck | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);

/**
 * Helper to make authenticated API requests
 */
async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
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
	 * Fetch all decks for current user
	 */
	async fetchDecks() {
		loading = true;
		error = null;

		try {
			const response = await apiRequest<{ decks: Deck[]; count: number }>('/v1/api/decks');
			decks = response.decks || [];
		} catch (err: any) {
			error = err.message || 'Failed to fetch decks';
			console.error('Fetch decks error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Fetch single deck by ID
	 */
	async fetchDeck(id: string) {
		loading = true;
		error = null;

		try {
			// For now, find in local decks or fetch all
			// TODO: Add GET /v1/api/decks/:id endpoint to backend
			if (decks.length === 0) {
				await this.fetchDecks();
			}
			currentDeck = decks.find((d) => d.id === id) || null;
			if (!currentDeck) {
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
	 * Create new deck
	 */
	async createDeck(input: CreateDeckInput): Promise<Deck | null> {
		loading = true;
		error = null;

		try {
			const response = await apiRequest<{ success: boolean; deck: Deck }>('/v1/api/decks', {
				method: 'POST',
				body: JSON.stringify({
					title: input.title,
					description: input.description || '',
					isPublic: input.is_public ?? false,
					tags: input.tags || [],
					settings: input.settings || {}
				})
			});

			if (response.deck) {
				const deck = { ...response.deck, card_count: 0 };
				decks = [deck, ...decks];
				return deck;
			}
			return null;
		} catch (err: any) {
			error = err.message || 'Failed to create deck';
			console.error('Create deck error:', err);
			return null;
		} finally {
			loading = false;
		}
	},

	/**
	 * Update deck
	 */
	async updateDeck(id: string, updates: UpdateDeckInput) {
		loading = true;
		error = null;

		try {
			const response = await apiRequest<{ success: boolean; deck: Deck }>(
				`/v1/api/decks/${id}`,
				{
					method: 'PUT',
					body: JSON.stringify(updates)
				}
			);

			if (response.deck) {
				// Update in list
				decks = decks.map((d) => (d.id === id ? { ...d, ...response.deck } : d));

				// Update current if it's the same
				if (currentDeck?.id === id) {
					currentDeck = { ...currentDeck, ...response.deck };
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
	 * Delete deck
	 */
	async deleteDeck(id: string) {
		loading = true;
		error = null;

		try {
			await apiRequest<{ success: boolean }>(`/v1/api/decks/${id}`, {
				method: 'DELETE'
			});

			// Remove from list
			decks = decks.filter((d) => d.id !== id);

			// Clear current if it's the same
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
	}
};
