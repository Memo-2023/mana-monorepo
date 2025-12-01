import { browser } from '$app/environment';
import { PUBLIC_BACKEND_URL, PUBLIC_MANA_CORE_AUTH_URL } from '$env/static/public';
import type {
	Deck,
	Slide,
	CreateDeckDto,
	UpdateDeckDto,
	CreateSlideDto,
	UpdateSlideDto,
	ReorderSlidesDto,
} from '@presi/shared';

const BASE_URL = PUBLIC_BACKEND_URL || 'http://localhost:3008';
const API_URL = `${BASE_URL}/api`;
const AUTH_URL = PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

// Storage keys must match @manacore/shared-auth
const STORAGE_KEYS = {
	APP_TOKEN: '@auth/appToken',
	REFRESH_TOKEN: '@auth/refreshToken',
};

function getToken(): string | null {
	if (!browser) return null;
	return localStorage.getItem(STORAGE_KEYS.APP_TOKEN);
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
	const token = getToken();

	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...options.headers,
	};

	if (token) {
		(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(url, {
		...options,
		headers,
	});

	if (response.status === 401) {
		// Token expired - try to refresh
		const refreshed = await refreshToken();
		if (refreshed) {
			// Retry the request with new token
			const newToken = getToken();
			if (newToken) {
				(headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
			}
			return fetch(url, { ...options, headers });
		}
		// Clear tokens and redirect to login
		if (browser) {
			localStorage.removeItem(STORAGE_KEYS.APP_TOKEN);
			localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
			window.location.href = '/login';
		}
	}

	return response;
}

async function refreshToken(): Promise<boolean> {
	if (!browser) return false;

	const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
	if (!storedRefreshToken) return false;

	try {
		const response = await fetch(`${AUTH_URL}/api/v1/auth/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken: storedRefreshToken }),
		});

		if (response.ok) {
			const data = await response.json();
			localStorage.setItem(STORAGE_KEYS.APP_TOKEN, data.accessToken);
			if (data.refreshToken) {
				localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
			}
			return true;
		}
	} catch (e) {
		console.error('Failed to refresh token:', e);
	}

	return false;
}

// Auth API (legacy - prefer using @manacore/shared-auth via auth store)
export const authApi = {
	async login(email: string, password: string) {
		const response = await fetch(`${AUTH_URL}/api/v1/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Login failed');
		}

		const data = await response.json();
		if (browser) {
			localStorage.setItem(STORAGE_KEYS.APP_TOKEN, data.accessToken);
			localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
		}
		return data;
	},

	async register(email: string, password: string) {
		const response = await fetch(`${AUTH_URL}/api/v1/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Registration failed');
		}

		const data = await response.json();
		if (browser) {
			localStorage.setItem(STORAGE_KEYS.APP_TOKEN, data.accessToken);
			localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
		}
		return data;
	},

	logout() {
		if (browser) {
			localStorage.removeItem(STORAGE_KEYS.APP_TOKEN);
			localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
		}
	},

	isAuthenticated(): boolean {
		if (!browser) return false;
		return !!localStorage.getItem(STORAGE_KEYS.APP_TOKEN);
	},
};

// Decks API
export const decksApi = {
	async getAll(): Promise<Deck[]> {
		const response = await fetchWithAuth(`${API_URL}/decks`);
		if (!response.ok) throw new Error('Failed to fetch decks');
		return response.json();
	},

	async getOne(id: string): Promise<{ deck: Deck; slides: Slide[] }> {
		const response = await fetchWithAuth(`${API_URL}/decks/${id}`);
		if (!response.ok) throw new Error('Failed to fetch deck');
		return response.json();
	},

	async create(dto: CreateDeckDto): Promise<Deck> {
		const response = await fetchWithAuth(`${API_URL}/decks`, {
			method: 'POST',
			body: JSON.stringify(dto),
		});
		if (!response.ok) throw new Error('Failed to create deck');
		return response.json();
	},

	async update(id: string, dto: UpdateDeckDto): Promise<Deck> {
		const response = await fetchWithAuth(`${API_URL}/decks/${id}`, {
			method: 'PUT',
			body: JSON.stringify(dto),
		});
		if (!response.ok) throw new Error('Failed to update deck');
		return response.json();
	},

	async delete(id: string): Promise<void> {
		const response = await fetchWithAuth(`${API_URL}/decks/${id}`, {
			method: 'DELETE',
		});
		if (!response.ok) throw new Error('Failed to delete deck');
	},
};

// Slides API
export const slidesApi = {
	async create(deckId: string, dto: CreateSlideDto): Promise<Slide> {
		const response = await fetchWithAuth(`${API_URL}/decks/${deckId}/slides`, {
			method: 'POST',
			body: JSON.stringify(dto),
		});
		if (!response.ok) throw new Error('Failed to create slide');
		return response.json();
	},

	async update(id: string, dto: UpdateSlideDto): Promise<Slide> {
		const response = await fetchWithAuth(`${API_URL}/slides/${id}`, {
			method: 'PUT',
			body: JSON.stringify(dto),
		});
		if (!response.ok) throw new Error('Failed to update slide');
		return response.json();
	},

	async delete(id: string): Promise<void> {
		const response = await fetchWithAuth(`${API_URL}/slides/${id}`, {
			method: 'DELETE',
		});
		if (!response.ok) throw new Error('Failed to delete slide');
	},

	async reorder(dto: ReorderSlidesDto): Promise<void> {
		const response = await fetchWithAuth(`${API_URL}/slides/reorder`, {
			method: 'PUT',
			body: JSON.stringify(dto),
		});
		if (!response.ok) throw new Error('Failed to reorder slides');
	},
};

// Share API
export interface ShareLink {
	id: string;
	deckId: string;
	shareCode: string;
	expiresAt: string | null;
	createdAt: string;
}

export const shareApi = {
	// Public - no auth required
	async getByCode(code: string): Promise<{ deck: any; slides: any[] }> {
		const response = await fetch(`${API_URL}/share/${code}`);
		if (!response.ok) {
			if (response.status === 404) {
				throw new Error('Shared deck not found or link has expired');
			}
			throw new Error('Failed to fetch shared deck');
		}
		return response.json();
	},

	// Authenticated endpoints
	async createShare(deckId: string, expiresAt?: string): Promise<ShareLink> {
		const response = await fetchWithAuth(`${API_URL}/share/deck/${deckId}`, {
			method: 'POST',
			body: JSON.stringify({ expiresAt }),
		});
		if (!response.ok) throw new Error('Failed to create share link');
		return response.json();
	},

	async getSharesForDeck(deckId: string): Promise<ShareLink[]> {
		const response = await fetchWithAuth(`${API_URL}/share/deck/${deckId}/links`);
		if (!response.ok) throw new Error('Failed to get share links');
		return response.json();
	},

	async deleteShare(shareId: string): Promise<void> {
		const response = await fetchWithAuth(`${API_URL}/share/${shareId}`, {
			method: 'DELETE',
		});
		if (!response.ok) throw new Error('Failed to delete share link');
	},
};
