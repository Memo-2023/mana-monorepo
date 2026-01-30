import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SlideContent {
	type: 'title' | 'content' | 'image' | 'split';
	title?: string;
	subtitle?: string;
	body?: string;
	imageUrl?: string;
	bulletPoints?: string[];
}

export interface Slide {
	id: string;
	deckId: string;
	order: number;
	content: SlideContent;
	createdAt: string;
}

export interface Theme {
	id: string;
	name: string;
	colors: {
		primary: string;
		secondary: string;
		background: string;
		text: string;
		accent: string;
	};
	fonts: {
		heading: string;
		body: string;
	};
	isDefault: boolean;
}

export interface Deck {
	id: string;
	title: string;
	description?: string;
	themeId?: string;
	isPublic: boolean;
	theme?: Theme;
	slides?: Slide[];
	createdAt: string;
	updatedAt: string;
}

export interface ShareLink {
	id: string;
	deckId: string;
	shareCode: string;
	expiresAt?: string;
	createdAt: string;
}

@Injectable()
export class PresiService {
	private readonly logger = new Logger(PresiService.name);
	private backendUrl: string;
	private apiPrefix: string;

	constructor(private configService: ConfigService) {
		this.backendUrl = this.configService.get<string>('presi.backendUrl') || 'http://localhost:3008';
		this.apiPrefix = this.configService.get<string>('presi.apiPrefix') || '/api';
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
			const url = `${this.backendUrl}${this.apiPrefix}${endpoint}`;
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

	async updateDeck(
		token: string,
		deckId: string,
		updates: { title?: string; description?: string; themeId?: string; isPublic?: boolean }
	): Promise<{ data?: Deck; error?: string }> {
		return this.request<Deck>(token, `/decks/${deckId}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		});
	}

	async deleteDeck(token: string, deckId: string): Promise<{ error?: string }> {
		return this.request(token, `/decks/${deckId}`, { method: 'DELETE' });
	}

	// Slide operations
	async addSlide(
		token: string,
		deckId: string,
		content: SlideContent
	): Promise<{ data?: Slide; error?: string }> {
		return this.request<Slide>(token, `/decks/${deckId}/slides`, {
			method: 'POST',
			body: JSON.stringify({ content }),
		});
	}

	async deleteSlide(token: string, slideId: string): Promise<{ error?: string }> {
		return this.request(token, `/slides/${slideId}`, { method: 'DELETE' });
	}

	// Theme operations
	async getThemes(): Promise<{ data?: Theme[]; error?: string }> {
		return this.publicRequest<Theme[]>('/themes');
	}

	async getTheme(themeId: string): Promise<{ data?: Theme; error?: string }> {
		return this.publicRequest<Theme>(`/themes/${themeId}`);
	}

	// Share operations
	async createShareLink(
		token: string,
		deckId: string,
		expiresAt?: string
	): Promise<{ data?: ShareLink; error?: string }> {
		return this.request<ShareLink>(token, `/share/deck/${deckId}`, {
			method: 'POST',
			body: JSON.stringify({ expiresAt }),
		});
	}

	async getShareLinks(token: string, deckId: string): Promise<{ data?: ShareLink[]; error?: string }> {
		return this.request<ShareLink[]>(token, `/share/deck/${deckId}/links`);
	}

	async deleteShareLink(token: string, shareId: string): Promise<{ error?: string }> {
		return this.request(token, `/share/${shareId}`, { method: 'DELETE' });
	}

	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.backendUrl}/health`);
			return response.ok;
		} catch {
			return false;
		}
	}

	getShareUrl(shareCode: string): string {
		return `${this.backendUrl}/share/${shareCode}`;
	}
}
