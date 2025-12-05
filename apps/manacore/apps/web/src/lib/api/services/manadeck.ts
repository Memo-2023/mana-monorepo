/**
 * ManaDeck API Service
 *
 * Fetches learning progress and deck data from the ManaDeck backend for dashboard widgets.
 */

import { createApiClient, type ApiResult } from '../base-client';

// Backend URL - falls back to localhost for development
const MANADECK_API_URL = import.meta.env.PUBLIC_MANADECK_API_URL || 'http://localhost:3009';

const client = createApiClient(MANADECK_API_URL);

/**
 * Deck entity from ManaDeck backend
 */
export interface Deck {
	id: string;
	userId: string;
	name: string;
	description?: string;
	cardCount: number;
	dueCount: number;
	newCount: number;
	createdAt: string;
	updatedAt: string;
	lastStudied?: string;
}

/**
 * Card entity from ManaDeck backend
 */
export interface Card {
	id: string;
	deckId: string;
	front: string;
	back: string;
	nextReview: string;
	interval: number;
	easeFactor: number;
	repetitions: number;
	createdAt: string;
	updatedAt: string;
}

/**
 * Learning progress statistics
 */
export interface LearningProgress {
	totalCards: number;
	cardsLearned: number;
	cardsDueToday: number;
	newCardsToday: number;
	streakDays: number;
	reviewsToday: number;
	averageRetention: number;
}

/**
 * ManaDeck service for dashboard widgets
 */
export const manadeckService = {
	/**
	 * Get user's decks
	 */
	async getDecks(): Promise<ApiResult<Deck[]>> {
		return client.get<Deck[]>('/api/decks');
	},

	/**
	 * Get learning progress
	 */
	async getLearningProgress(): Promise<ApiResult<LearningProgress>> {
		return client.get<LearningProgress>('/api/progress');
	},

	/**
	 * Get cards due for review today
	 */
	async getDueCards(limit = 10): Promise<ApiResult<Card[]>> {
		return client.get<Card[]>(`/api/cards/due?limit=${limit}`);
	},

	/**
	 * Get total due cards count across all decks
	 */
	async getTotalDueCount(): Promise<ApiResult<number>> {
		const result = await this.getDecks();

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		const totalDue = result.data.reduce((sum, deck) => sum + deck.dueCount, 0);
		return { data: totalDue, error: null };
	},

	/**
	 * Get study streak
	 */
	async getStreak(): Promise<ApiResult<number>> {
		const result = await this.getLearningProgress();

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data.streakDays, error: null };
	},
};
