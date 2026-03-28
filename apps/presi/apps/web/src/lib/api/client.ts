/**
 * Presi API Client — Share endpoints only.
 *
 * All CRUD (decks, slides, themes) is handled via local-first + mana-sync.
 * This client only handles share links which require server-side state.
 */

import { browser } from '$app/environment';

const STORAGE_KEYS = {
	APP_TOKEN: '@auth/appToken',
};

function getServerUrl(): string {
	if (browser) {
		const injected = (window as unknown as { __PUBLIC_PRESI_SERVER_URL__?: string })
			.__PUBLIC_PRESI_SERVER_URL__;
		if (injected) return injected;
	}
	return import.meta.env.PUBLIC_PRESI_SERVER_URL || 'http://localhost:3008';
}

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
	return fetch(url, { ...options, headers });
}

// Share API
export interface ShareLink {
	id: string;
	deckId: string;
	shareCode: string;
	expiresAt: string | null;
	createdAt: string;
}

export const shareApi = {
	/** Public — view a shared deck by share code (no auth required). */
	async getByCode(code: string): Promise<{ deck: any; slides: any[] }> {
		const response = await fetch(`${getServerUrl()}/api/share/${code}`);
		if (!response.ok) {
			if (response.status === 404) {
				throw new Error('Shared deck not found or link has expired');
			}
			throw new Error('Failed to fetch shared deck');
		}
		return response.json();
	},

	/** Create a share link for a deck. */
	async createShare(deckId: string, expiresAt?: string): Promise<ShareLink> {
		const response = await fetchWithAuth(`${getServerUrl()}/api/share/deck/${deckId}`, {
			method: 'POST',
			body: JSON.stringify({ expiresAt }),
		});
		if (!response.ok) throw new Error('Failed to create share link');
		return response.json();
	},

	/** List share links for a deck. */
	async getSharesForDeck(deckId: string): Promise<ShareLink[]> {
		const response = await fetchWithAuth(`${getServerUrl()}/api/share/deck/${deckId}/links`);
		if (!response.ok) throw new Error('Failed to get share links');
		return response.json();
	},

	/** Delete a share link. */
	async deleteShare(shareId: string): Promise<void> {
		const response = await fetchWithAuth(`${getServerUrl()}/api/share/${shareId}`, {
			method: 'DELETE',
		});
		if (!response.ok) throw new Error('Failed to delete share link');
	},
};
