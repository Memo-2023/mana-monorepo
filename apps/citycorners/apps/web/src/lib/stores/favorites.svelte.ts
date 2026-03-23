/**
 * Favorites Store - Manages favorite locations using Svelte 5 runes
 */

import { browser } from '$app/environment';
import { authStore } from './auth.svelte';

interface Favorite {
	id: string;
	userId: string;
	locationId: string;
	createdAt: string;
}

function getBackendUrl(): string {
	if (browser && typeof window !== 'undefined') {
		return (window as any).__PUBLIC_BACKEND_URL__ || 'http://localhost:3025';
	}
	return 'http://localhost:3025';
}

let favoriteLocationIds = $state<Set<string>>(new Set());
let loading = $state(false);

export const favoritesStore = {
	get favoriteIds() {
		return favoriteLocationIds;
	},
	get loading() {
		return loading;
	},

	isFavorite(locationId: string): boolean {
		return favoriteLocationIds.has(locationId);
	},

	async load() {
		if (!authStore.isAuthenticated) return;

		loading = true;
		try {
			const token = await authStore.getValidToken();
			if (!token) return;

			const res = await fetch(`${getBackendUrl()}/favorites`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (res.ok) {
				const data = await res.json();
				favoriteLocationIds = new Set(data.favorites.map((f: Favorite) => f.locationId));
			}
		} catch (err) {
			console.error('Failed to load favorites:', err);
		} finally {
			loading = false;
		}
	},

	async toggle(locationId: string) {
		if (!authStore.isAuthenticated) return;

		const token = await authStore.getValidToken();
		if (!token) return;

		const isFav = favoriteLocationIds.has(locationId);

		// Optimistic update
		const newSet = new Set(favoriteLocationIds);
		if (isFav) {
			newSet.delete(locationId);
		} else {
			newSet.add(locationId);
		}
		favoriteLocationIds = newSet;

		try {
			const res = await fetch(`${getBackendUrl()}/favorites/${locationId}`, {
				method: isFav ? 'DELETE' : 'POST',
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!res.ok) {
				// Revert on error
				const revertSet = new Set(favoriteLocationIds);
				if (isFav) {
					revertSet.add(locationId);
				} else {
					revertSet.delete(locationId);
				}
				favoriteLocationIds = revertSet;
			}
		} catch (err) {
			console.error('Failed to toggle favorite:', err);
			// Revert
			const revertSet = new Set(favoriteLocationIds);
			if (isFav) {
				revertSet.add(locationId);
			} else {
				revertSet.delete(locationId);
			}
			favoriteLocationIds = revertSet;
		}
	},

	clear() {
		favoriteLocationIds = new Set();
	},
};
