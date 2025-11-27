import { create } from 'zustand';
import { apiClient } from '../services/apiClient';

// Content types for different card types
export interface TextContent {
	text: string;
	formatting?: {
		bold?: boolean;
		italic?: boolean;
		underline?: boolean;
	};
}

export interface FlashcardContent {
	front: string;
	back: string;
	hint?: string;
}

export interface QuizContent {
	question: string;
	options: string[];
	correct_answer: number;
	explanation?: string;
}

export interface MixedContent {
	blocks: ContentBlock[];
}

export type ContentBlock =
	| { type: 'text'; data: { text: string } }
	| { type: 'image'; data: { url: string; caption?: string } }
	| { type: 'quiz'; data: QuizContent }
	| { type: 'flashcard'; data: FlashcardContent };

export type CardContent = TextContent | FlashcardContent | QuizContent | MixedContent;

export interface Card {
	id: string;
	deck_id: string;
	position: number;
	title?: string;
	content: CardContent;
	card_type: 'text' | 'flashcard' | 'quiz' | 'mixed';
	ai_model?: string;
	ai_prompt?: string;
	version: number;
	is_favorite: boolean;
	created_at: string;
	updated_at: string;
}

// Helper to map backend response to frontend format
function mapCardFromApi(card: any): Card {
	return {
		id: card.id,
		deck_id: card.deckId,
		position: card.position,
		title: card.title,
		content: card.content,
		card_type: card.cardType,
		ai_model: card.aiModel,
		ai_prompt: card.aiPrompt,
		version: card.version || 1,
		is_favorite: card.isFavorite || false,
		created_at: card.createdAt,
		updated_at: card.updatedAt,
	};
}

interface CardState {
	cards: Card[];
	currentCard: Card | null;
	isLoading: boolean;
	error: string | null;

	// CRUD Operations
	fetchCards: (deckId: string) => Promise<void>;
	fetchCard: (id: string) => Promise<void>;
	createCard: (deckId: string, cardData: Partial<Card>) => Promise<Card>;
	updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
	deleteCard: (id: string) => Promise<void>;
	duplicateCard: (id: string) => Promise<Card>;

	// Organization
	reorderCards: (deckId: string, cardIds: string[]) => Promise<void>;
	toggleFavorite: (id: string) => Promise<void>;

	// Bulk operations
	deleteMultipleCards: (ids: string[]) => Promise<void>;
	moveCardsToDecks: (cardIds: string[], targetDeckId: string) => Promise<void>;

	// Utility
	clearError: () => void;
	resetCards: () => void;
}

export const useCardStore = create<CardState>((set, get) => ({
	cards: [],
	currentCard: null,
	isLoading: false,
	error: null,

	fetchCards: async (deckId: string) => {
		try {
			set({ isLoading: true, error: null });

			const response = await apiClient.getDeckCards(deckId);

			console.log('[DEBUG] fetchCards - Deck ID:', deckId);
			console.log('[DEBUG] fetchCards - Cards found:', response.data?.cards?.length || 0);
			console.log('[DEBUG] fetchCards - Error:', response.error);

			if (response.error) {
				throw new Error(response.error);
			}

			const cards = (response.data?.cards || []).map(mapCardFromApi);
			set({ cards });
		} catch (error: any) {
			set({ error: error.message || 'Failed to fetch cards' });
			console.error('[ERROR] fetchCards:', error);
		} finally {
			set({ isLoading: false });
		}
	},

	fetchCard: async (id: string) => {
		try {
			set({ isLoading: true, error: null });

			const response = await apiClient.getCard(id);

			if (response.error) {
				throw new Error(response.error);
			}

			const card = mapCardFromApi(response.data?.card);
			set({ currentCard: card });
		} catch (error: any) {
			set({ error: error.message || 'Failed to fetch card' });
			console.error('[ERROR] fetchCard:', error);
		} finally {
			set({ isLoading: false });
		}
	},

	createCard: async (deckId: string, cardData: Partial<Card>) => {
		try {
			set({ isLoading: true, error: null });

			// Get next position
			const cards = get().cards;
			const maxPosition = cards.length > 0 ? Math.max(...cards.map((c) => c.position)) : 0;

			const response = await apiClient.createCard({
				deckId,
				title: cardData.title || '',
				content: cardData.content || { text: '' },
				cardType: cardData.card_type || 'text',
				position: maxPosition + 1,
				aiModel: cardData.ai_model,
				aiPrompt: cardData.ai_prompt,
			});

			if (response.error) {
				throw new Error(response.error);
			}

			const newCard = mapCardFromApi(response.data?.card);
			set({ cards: [...cards, newCard] });

			return newCard;
		} catch (error: any) {
			set({ error: error.message || 'Failed to create card' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	updateCard: async (id: string, updates: Partial<Card>) => {
		try {
			set({ isLoading: true, error: null });

			const response = await apiClient.updateCard(id, {
				title: updates.title,
				content: updates.content,
				cardType: updates.card_type,
				position: updates.position,
				isFavorite: updates.is_favorite,
			});

			if (response.error) {
				throw new Error(response.error);
			}

			// Update local state
			const cards = get().cards;
			set({
				cards: cards.map((card) => (card.id === id ? { ...card, ...updates } : card)),
			});

			// Update current card if it's the one being edited
			if (get().currentCard?.id === id) {
				set({ currentCard: { ...get().currentCard!, ...updates } });
			}
		} catch (error: any) {
			set({ error: error.message || 'Failed to update card' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	deleteCard: async (id: string) => {
		try {
			set({ isLoading: true, error: null });

			const response = await apiClient.deleteCard(id);

			if (response.error) {
				throw new Error(response.error);
			}

			// Remove from local state
			const cards = get().cards;
			set({ cards: cards.filter((card) => card.id !== id) });

			// Clear current card if it was deleted
			if (get().currentCard?.id === id) {
				set({ currentCard: null });
			}
		} catch (error: any) {
			set({ error: error.message || 'Failed to delete card' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	duplicateCard: async (id: string) => {
		try {
			set({ isLoading: true, error: null });

			const cardToDuplicate = get().cards.find((card) => card.id === id);
			if (!cardToDuplicate) throw new Error('Card not found');

			const response = await apiClient.createCard({
				deckId: cardToDuplicate.deck_id,
				title: cardToDuplicate.title ? `${cardToDuplicate.title} (Kopie)` : '',
				content: cardToDuplicate.content,
				cardType: cardToDuplicate.card_type,
				position: cardToDuplicate.position + 1,
				aiModel: cardToDuplicate.ai_model,
				aiPrompt: cardToDuplicate.ai_prompt,
			});

			if (response.error) {
				throw new Error(response.error);
			}

			const newCard = mapCardFromApi(response.data?.card);

			// Add to local state
			const cards = get().cards;
			const insertIndex = cards.findIndex((card) => card.id === id) + 1;
			const newCards = [...cards];
			newCards.splice(insertIndex, 0, newCard);
			set({ cards: newCards });

			return newCard;
		} catch (error: any) {
			set({ error: error.message || 'Failed to duplicate card' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	reorderCards: async (deckId: string, cardIds: string[]) => {
		try {
			set({ isLoading: true, error: null });

			const response = await apiClient.reorderCards(deckId, cardIds);

			if (response.error) {
				throw new Error(response.error);
			}

			// Refresh cards to get correct order
			await get().fetchCards(deckId);
		} catch (error: any) {
			set({ error: error.message || 'Failed to reorder cards' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	toggleFavorite: async (id: string) => {
		try {
			const card = get().cards.find((c) => c.id === id);
			if (!card) return;

			const newFavoriteState = !card.is_favorite;

			await get().updateCard(id, {
				is_favorite: newFavoriteState,
			});
		} catch (error: any) {
			console.error('Error toggling favorite:', error);
		}
	},

	deleteMultipleCards: async (ids: string[]) => {
		try {
			set({ isLoading: true, error: null });

			// Delete cards one by one (could be optimized with batch endpoint)
			for (const id of ids) {
				const response = await apiClient.deleteCard(id);
				if (response.error) {
					console.error(`Failed to delete card ${id}:`, response.error);
				}
			}

			// Remove from local state
			const cards = get().cards;
			set({ cards: cards.filter((card) => !ids.includes(card.id)) });
		} catch (error: any) {
			set({ error: error.message || 'Failed to delete cards' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	moveCardsToDecks: async (cardIds: string[], targetDeckId: string) => {
		try {
			set({ isLoading: true, error: null });

			// Update each card's deck (could be optimized with batch endpoint)
			for (const cardId of cardIds) {
				const response = await apiClient.updateCard(cardId, {
					// Note: Backend would need to support deckId update
				});
				if (response.error) {
					console.error(`Failed to move card ${cardId}:`, response.error);
				}
			}

			// Remove moved cards from local state
			const cards = get().cards;
			set({ cards: cards.filter((card) => !cardIds.includes(card.id)) });
		} catch (error: any) {
			set({ error: error.message || 'Failed to move cards' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	clearError: () => set({ error: null }),

	resetCards: () => set({ cards: [], currentCard: null }),
}));
