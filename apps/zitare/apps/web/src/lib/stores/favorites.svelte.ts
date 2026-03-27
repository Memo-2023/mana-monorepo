/**
 * Favorites Store — Local-First with Dexie.js
 * All reads/writes go to IndexedDB. Sync happens in background when authenticated.
 */

import { favoriteCollection, type LocalFavorite } from '$lib/data/local-store';

interface Favorite {
	id: string;
	quoteId: string;
	createdAt: string;
}

// State
let favorites = $state<Favorite[]>([]);
let loading = $state(false);
let initialized = $state(false);

function toFavorite(local: LocalFavorite): Favorite {
	return {
		id: local.id,
		quoteId: local.quoteId,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
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

	isFavorite(quoteId: string): boolean {
		return favorites.some((f) => f.quoteId === quoteId);
	},

	async load() {
		loading = true;
		try {
			const localFavs = await favoriteCollection.getAll();
			favorites = localFavs.map(toFavorite);
			initialized = true;
		} catch (error) {
			console.error('Failed to load favorites:', error);
			favorites = [];
		} finally {
			loading = false;
		}
	},

	async add(quoteId: string) {
		try {
			const newFav: LocalFavorite = {
				id: crypto.randomUUID(),
				quoteId,
			};
			const inserted = await favoriteCollection.insert(newFav);
			favorites = [...favorites, toFavorite(inserted)];
		} catch (error) {
			console.error('Failed to add favorite:', error);
			throw error;
		}
	},

	async remove(quoteId: string) {
		try {
			const fav = favorites.find((f) => f.quoteId === quoteId);
			if (fav) {
				await favoriteCollection.delete(fav.id);
				favorites = favorites.filter((f) => f.quoteId !== quoteId);
			}
		} catch (error) {
			console.error('Failed to remove favorite:', error);
			throw error;
		}
	},

	async toggle(quoteId: string) {
		if (this.isFavorite(quoteId)) {
			await this.remove(quoteId);
		} else {
			await this.add(quoteId);
		}
	},

	clear() {
		favorites = [];
		initialized = false;
	},
};
