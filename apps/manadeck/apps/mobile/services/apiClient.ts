/**
 * API Client for ManaDeck Backend
 * Uses shared-auth TokenManager for automatic token handling
 */

import { tokenManager } from './tokenManager';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3009';

interface ApiResponse<T> {
	data: T | null;
	error: string | null;
}

class ApiClient {
	private async getAuthHeaders(): Promise<Record<string, string>> {
		const token = await tokenManager.getValidToken();
		if (!token) {
			throw new Error('Not authenticated');
		}

		return {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		};
	}

	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
		try {
			const headers = await this.getAuthHeaders();
			const response = await fetch(`${API_URL}${endpoint}`, {
				...options,
				headers: {
					...headers,
					...options.headers,
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return {
					data: null,
					error: errorData.message || `Request failed with status ${response.status}`,
				};
			}

			const data = await response.json();
			return { data, error: null };
		} catch (error: any) {
			console.error(`API Error [${endpoint}]:`, error);
			return {
				data: null,
				error: error.message || 'Network error',
			};
		}
	}

	// ============ Profile ============
	async getProfile() {
		return this.request<{ user: any; credits: number }>('/api/profile');
	}

	async getCreditBalance() {
		return this.request<{ balance: number }>('/api/credits/balance');
	}

	// ============ Decks ============
	async getDecks() {
		return this.request<{ decks: any[]; count: number }>('/api/decks');
	}

	async getDeck(id: string) {
		return this.request<{ deck: any }>(`/api/decks/${id}`);
	}

	async createDeck(deckData: {
		title: string;
		description?: string;
		coverImageUrl?: string;
		isPublic?: boolean;
		tags?: string[];
		settings?: Record<string, any>;
		metadata?: Record<string, any>;
	}) {
		return this.request<{ deck: any; creditsUsed: number }>('/api/decks', {
			method: 'POST',
			body: JSON.stringify(deckData),
		});
	}

	async updateDeck(
		id: string,
		updates: {
			title?: string;
			description?: string;
			coverImageUrl?: string;
			isPublic?: boolean;
			tags?: string[];
			settings?: Record<string, any>;
			metadata?: Record<string, any>;
		}
	) {
		return this.request<{ deck: any }>(`/api/decks/${id}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		});
	}

	async deleteDeck(id: string) {
		return this.request<{ success: boolean }>(`/api/decks/${id}`, {
			method: 'DELETE',
		});
	}

	async generateDeckWithAI(requestData: {
		prompt: string;
		deckTitle: string;
		deckDescription?: string;
		cardCount?: number;
		cardTypes?: string[];
		difficulty?: string;
		tags?: string[];
		language?: string;
	}) {
		return this.request<{
			deck: any;
			cards: any[];
			cardCount: number;
			creditsUsed: number;
			metadata: any;
		}>('/api/decks/generate', {
			method: 'POST',
			body: JSON.stringify(requestData),
		});
	}

	// ============ Cards ============
	async getDeckCards(deckId: string) {
		return this.request<{ cards: any[]; count: number }>(`/api/decks/${deckId}/cards`);
	}

	async getCard(id: string) {
		return this.request<{ card: any }>(`/api/cards/${id}`);
	}

	async createCard(cardData: {
		deckId: string;
		title?: string;
		content: any;
		cardType?: string;
		position?: number;
		aiModel?: string;
		aiPrompt?: string;
	}) {
		return this.request<{ card: any }>('/api/cards', {
			method: 'POST',
			body: JSON.stringify(cardData),
		});
	}

	async updateCard(
		id: string,
		updates: {
			title?: string;
			content?: any;
			cardType?: string;
			position?: number;
			isFavorite?: boolean;
		}
	) {
		return this.request<{ card: any }>(`/api/cards/${id}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		});
	}

	async deleteCard(id: string) {
		return this.request<{ success: boolean }>(`/api/cards/${id}`, {
			method: 'DELETE',
		});
	}

	async reorderCards(deckId: string, cardIds: string[]) {
		return this.request<{ success: boolean }>('/api/cards/reorder', {
			method: 'POST',
			body: JSON.stringify({ deckId, cardIds }),
		});
	}

	// ============ Stats ============
	async getStats() {
		return this.request<{
			stats: {
				totalDecks: number;
				totalCards: number;
				totalSessions: number;
				totalCardsStudied: number;
				streakDays: number;
			};
		}>('/api/stats');
	}

	// ============ Study Sessions ============
	async getStudySessions() {
		return this.request<{ sessions: any[]; count: number }>('/api/study-sessions');
	}

	async getStudySession(id: string) {
		return this.request<{ session: any }>(`/api/study-sessions/${id}`);
	}

	async getStudySessionsByDeck(deckId: string) {
		return this.request<{ sessions: any[]; count: number }>(`/api/study-sessions/deck/${deckId}`);
	}

	async getStudySessionsByDateRange(startDate: string, endDate: string) {
		return this.request<{ sessions: any[]; count: number }>(
			`/api/study-sessions/range?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
		);
	}

	async getStudySessionStats() {
		return this.request<{
			stats: {
				totalSessions: number;
				totalCardsStudied: number;
				totalCorrectCards: number;
				totalTimeSeconds: number;
			};
		}>('/api/study-sessions/stats');
	}

	async createStudySession(sessionData: {
		deckId: string;
		startedAt?: string;
		endedAt?: string;
		totalCards?: number;
		completedCards?: number;
		correctCards?: number;
		timeSpentSeconds?: number;
	}) {
		return this.request<{ session: any }>('/api/study-sessions', {
			method: 'POST',
			body: JSON.stringify(sessionData),
		});
	}

	async updateStudySession(
		id: string,
		updates: {
			endedAt?: string;
			totalCards?: number;
			completedCards?: number;
			correctCards?: number;
			timeSpentSeconds?: number;
		}
	) {
		return this.request<{ session: any }>(`/api/study-sessions/${id}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		});
	}

	// ============ Card Progress ============
	async getCardProgress() {
		return this.request<{ progress: any[]; count: number }>('/api/progress');
	}

	async getCardProgressByDeck(deckId: string) {
		return this.request<{ progress: any[]; count: number }>(`/api/progress/deck/${deckId}`);
	}

	async getCardProgressByCard(cardId: string) {
		return this.request<{ progress: any | null }>(`/api/progress/card/${cardId}`);
	}

	async getCardProgressStats() {
		return this.request<{
			stats: {
				totalCards: number;
				newCards: number;
				learningCards: number;
				reviewCards: number;
				avgEaseFactor: string;
			};
		}>('/api/progress/stats');
	}

	async getDueCards() {
		return this.request<{ progress: any[]; count: number }>('/api/progress/due');
	}

	async getDueCardsByDeck(deckId: string) {
		return this.request<{ progress: any[]; count: number }>(`/api/progress/deck/${deckId}/due`);
	}

	async upsertCardProgress(progressData: {
		cardId: string;
		easeFactor?: number;
		interval?: number;
		repetitions?: number;
		lastReviewed?: string;
		nextReview?: string;
		status?: 'new' | 'learning' | 'review';
	}) {
		return this.request<{ progress: any }>('/api/progress', {
			method: 'POST',
			body: JSON.stringify(progressData),
		});
	}

	// ============ AI Operations ============
	async generateCardsFromImage(imageBase64: string, context?: string, cardCount?: number) {
		return this.request<{
			cards: Array<{
				type: string;
				content: any;
				metadata: { confidence: number; source: string; tags: string[] };
			}>;
		}>('/api/ai/generate-from-image', {
			method: 'POST',
			body: JSON.stringify({ image: imageBase64, context, cardCount }),
		});
	}

	async enhanceContent(content: string, cardType: string) {
		return this.request<{ enhancedContent: string }>('/api/ai/enhance-content', {
			method: 'POST',
			body: JSON.stringify({ content, cardType }),
		});
	}
}

export const apiClient = new ApiClient();
