/**
 * Favorites Store - Manages user's favorite quotes
 */

import { browser } from '$app/environment';
import { authStore } from './auth.svelte';

interface Favorite {
	id: string;
	quoteId: string;
	createdAt: string;
}

// State
let favorites = $state<Favorite[]>([]);
let loading = $state(false);
let initialized = $state(false);

// Get backend URL
function getBackendUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_BACKEND_URL__?: string })
			.__PUBLIC_BACKEND_URL__;
		return injectedUrl || 'http://localhost:3007';
	}
	return process.env.PUBLIC_BACKEND_URL || 'http://localhost:3007';
}

async function fetchWithAuth(path: string, options: RequestInit = {}) {
	const token = await authStore.getValidToken();
	if (!token) {
		throw new Error('Not authenticated');
	}

	const response = await fetch(`${getBackendUrl()}/api${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
			...options.headers,
		},
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || 'Request failed');
	}

	return response.json();
}

export const favoritesStore = {
	get favorites() {
		return favorites;
	},
	get loading() {
		return loading;
	},
	get initialized() {
		return initialized;
	},

	/**
	 * Check if a quote is favorited
	 */
	isFavorite(quoteId: string): boolean {
		return favorites.some((f) => f.quoteId === quoteId);
	},

	/**
	 * Load favorites from backend
	 */
	async load() {
		if (!authStore.isAuthenticated) {
			favorites = [];
			initialized = true;
			return;
		}

		loading = true;
		try {
			const data = await fetchWithAuth('/favorites');
			favorites = data.favorites || [];
			initialized = true;
		} catch (error) {
			console.error('Failed to load favorites:', error);
			favorites = [];
		} finally {
			loading = false;
		}
	},

	/**
	 * Add a quote to favorites
	 */
	async add(quoteId: string) {
		if (!authStore.isAuthenticated) return;

		try {
			const data = await fetchWithAuth('/favorites', {
				method: 'POST',
				body: JSON.stringify({ quoteId }),
			});
			favorites = [...favorites, data.favorite];
		} catch (error) {
			console.error('Failed to add favorite:', error);
			throw error;
		}
	},

	/**
	 * Remove a quote from favorites
	 */
	async remove(quoteId: string) {
		if (!authStore.isAuthenticated) return;

		try {
			await fetchWithAuth(`/favorites/${quoteId}`, {
				method: 'DELETE',
			});
			favorites = favorites.filter((f) => f.quoteId !== quoteId);
		} catch (error) {
			console.error('Failed to remove favorite:', error);
			throw error;
		}
	},

	/**
	 * Toggle favorite status
	 */
	async toggle(quoteId: string) {
		if (this.isFavorite(quoteId)) {
			await this.remove(quoteId);
		} else {
			await this.add(quoteId);
		}
	},

	/**
	 * Clear all favorites (client-side only)
	 */
	clear() {
		favorites = [];
		initialized = false;
	},
};
