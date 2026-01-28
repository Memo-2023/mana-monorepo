import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Favorite {
	id: string;
	userId: string;
	quoteId: string;
	createdAt: string;
}

export interface UserList {
	id: string;
	userId: string;
	name: string;
	description?: string;
	quoteIds: string[];
	createdAt: string;
	updatedAt: string;
}

@Injectable()
export class ZitareService {
	private readonly logger = new Logger(ZitareService.name);
	private readonly baseUrl: string;

	constructor(private configService: ConfigService) {
		const backendUrl =
			this.configService.get<string>('zitare.backendUrl') || 'http://localhost:3007';
		const apiPrefix = this.configService.get<string>('zitare.apiPrefix') || '/api/v1';
		this.baseUrl = `${backendUrl}${apiPrefix}`;
	}

	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}/health`);
			return response.ok;
		} catch {
			return false;
		}
	}

	// Favorites

	async getFavorites(token: string): Promise<Favorite[]> {
		const response = await fetch(`${this.baseUrl}/favorites`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!response.ok) {
			throw new Error(`Failed to get favorites: ${response.status}`);
		}

		const data = await response.json();
		return data.favorites || [];
	}

	async addFavorite(quoteId: string, token: string): Promise<Favorite> {
		const response = await fetch(`${this.baseUrl}/favorites`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ quoteId }),
		});

		if (response.status === 409) {
			throw new Error('Dieses Zitat ist bereits in deinen Favoriten');
		}

		if (!response.ok) {
			throw new Error(`Failed to add favorite: ${response.status}`);
		}

		return response.json();
	}

	async removeFavorite(quoteId: string, token: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/favorites/${quoteId}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!response.ok) {
			throw new Error(`Failed to remove favorite: ${response.status}`);
		}
	}

	// Lists

	async getLists(token: string): Promise<UserList[]> {
		const response = await fetch(`${this.baseUrl}/lists`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!response.ok) {
			throw new Error(`Failed to get lists: ${response.status}`);
		}

		const data = await response.json();
		return data.lists || [];
	}

	async getList(listId: string, token: string): Promise<UserList> {
		const response = await fetch(`${this.baseUrl}/lists/${listId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!response.ok) {
			throw new Error(`Failed to get list: ${response.status}`);
		}

		return response.json();
	}

	async createList(
		name: string,
		description: string | undefined,
		token: string
	): Promise<UserList> {
		const response = await fetch(`${this.baseUrl}/lists`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ name, description }),
		});

		if (!response.ok) {
			throw new Error(`Failed to create list: ${response.status}`);
		}

		return response.json();
	}

	async deleteList(listId: string, token: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/lists/${listId}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!response.ok) {
			throw new Error(`Failed to delete list: ${response.status}`);
		}
	}

	async addQuoteToList(listId: string, quoteId: string, token: string): Promise<UserList> {
		const response = await fetch(`${this.baseUrl}/lists/${listId}/quotes`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ quoteId }),
		});

		if (!response.ok) {
			throw new Error(`Failed to add quote to list: ${response.status}`);
		}

		return response.json();
	}

	async removeQuoteFromList(listId: string, quoteId: string, token: string): Promise<UserList> {
		const response = await fetch(`${this.baseUrl}/lists/${listId}/quotes/${quoteId}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!response.ok) {
			throw new Error(`Failed to remove quote from list: ${response.status}`);
		}

		return response.json();
	}
}
