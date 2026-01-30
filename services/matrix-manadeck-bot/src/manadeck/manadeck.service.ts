import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Deck {
	id: string;
	title: string;
	description?: string;
	coverImageUrl?: string;
	isPublic: boolean;
	isFeatured: boolean;
	tags: string[];
	cardCount?: number;
	createdAt: string;
	updatedAt: string;
}

export interface Card {
	id: string;
	deckId: string;
	position: number;
	title?: string;
	content: any;
	cardType: 'text' | 'flashcard' | 'quiz' | 'mixed';
	isFavorite: boolean;
}

export interface StudySession {
	id: string;
	deckId: string;
	mode: string;
	totalCards: number;
	completedCards: number;
	correctCards: number;
	startedAt: string;
	completedAt?: string;
}

export interface UserStats {
	totalDecks: number;
	totalCards: number;
	totalSessions: number;
	streakDays: number;
	averageAccuracy: number;
}

export interface CardProgress {
	cardId: string;
	status: string;
	nextReview: string;
	interval: number;
	easeFactor: number;
}

@Injectable()
export class ManadeckService {
	private readonly logger = new Logger(ManadeckService.name);
	private backendUrl: string;
	private apiPrefix: string;

	constructor(private configService: ConfigService) {
		this.backendUrl = this.configService.get<string>('manadeck.backendUrl') || 'http://localhost:3009';
		this.apiPrefix = this.configService.get<string>('manadeck.apiPrefix') || '/api';
	}

	private async request<T>(
		token: string,
		endpoint: string,
		options: RequestInit = {}
	): Promise<{ data?: T; error?: string }> {
		try {
			const url = `${this.backendUrl}${this.apiPrefix}${endpoint}`;
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					...options.headers,
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return { error: errorData.message || `Fehler: ${response.status}` };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			this.logger.error(`Request failed: ${endpoint}`, error);
			return { error: 'Verbindung zum Backend fehlgeschlagen' };
		}
	}

	private async publicRequest<T>(endpoint: string): Promise<{ data?: T; error?: string }> {
		try {
			const url = `${this.backendUrl}/public${endpoint}`;
			const response = await fetch(url, {
				headers: { 'Content-Type': 'application/json' },
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return { error: errorData.message || `Fehler: ${response.status}` };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			this.logger.error(`Public request failed: ${endpoint}`, error);
			return { error: 'Verbindung zum Backend fehlgeschlagen' };
		}
	}

	// Deck operations
	async getDecks(token: string): Promise<{ data?: Deck[]; error?: string }> {
		return this.request<Deck[]>(token, '/decks');
	}

	async getDeck(token: string, deckId: string): Promise<{ data?: Deck; error?: string }> {
		return this.request<Deck>(token, `/decks/${deckId}`);
	}

	async createDeck(
		token: string,
		title: string,
		description?: string
	): Promise<{ data?: Deck; error?: string }> {
		return this.request<Deck>(token, '/decks', {
			method: 'POST',
			body: JSON.stringify({ title, description }),
		});
	}

	async deleteDeck(token: string, deckId: string): Promise<{ error?: string }> {
		return this.request(token, `/decks/${deckId}`, { method: 'DELETE' });
	}

	// Card operations
	async getCards(token: string, deckId: string): Promise<{ data?: Card[]; error?: string }> {
		return this.request<Card[]>(token, `/decks/${deckId}/cards`);
	}

	async getCard(token: string, cardId: string): Promise<{ data?: Card; error?: string }> {
		return this.request<Card>(token, `/cards/${cardId}`);
	}

	// AI generation
	async generateDeck(
		token: string,
		prompt: string,
		options: {
			deckTitle?: string;
			cardCount?: number;
			cardTypes?: string[];
			difficulty?: string;
		} = {}
	): Promise<{ data?: { deck: Deck; cards: Card[] }; error?: string }> {
		return this.request<{ deck: Deck; cards: Card[] }>(token, '/decks/generate', {
			method: 'POST',
			body: JSON.stringify({
				prompt,
				deckTitle: options.deckTitle || prompt.substring(0, 50),
				cardCount: options.cardCount || 10,
				cardTypes: options.cardTypes || ['flashcard'],
				difficulty: options.difficulty || 'intermediate',
			}),
		});
	}

	// Study sessions
	async startStudySession(
		token: string,
		deckId: string,
		mode: string = 'all'
	): Promise<{ data?: StudySession; error?: string }> {
		return this.request<StudySession>(token, '/study-sessions', {
			method: 'POST',
			body: JSON.stringify({ deckId, mode }),
		});
	}

	async getStudySessions(token: string): Promise<{ data?: StudySession[]; error?: string }> {
		return this.request<StudySession[]>(token, '/study-sessions');
	}

	// Progress
	async getDueCards(token: string): Promise<{ data?: CardProgress[]; error?: string }> {
		return this.request<CardProgress[]>(token, '/progress/due');
	}

	async getProgressStats(token: string): Promise<{ data?: any; error?: string }> {
		return this.request<any>(token, '/progress/stats');
	}

	// User stats
	async getStats(token: string): Promise<{ data?: UserStats; error?: string }> {
		return this.request<UserStats>(token, '/stats');
	}

	async getCredits(token: string): Promise<{ data?: { balance: number }; error?: string }> {
		return this.request<{ balance: number }>(token, '/credits/balance');
	}

	// Public endpoints
	async getFeaturedDecks(): Promise<{ data?: Deck[]; error?: string }> {
		return this.publicRequest<Deck[]>('/featured-decks');
	}

	async getLeaderboard(limit: number = 10): Promise<{ data?: any[]; error?: string }> {
		return this.publicRequest<any[]>(`/leaderboard?limit=${limit}`);
	}

	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.backendUrl}/public/health`);
			return response.ok;
		} catch {
			return false;
		}
	}
}
