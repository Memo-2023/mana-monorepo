/**
 * Favorites Store — Mutation-only
 * Reads come from useLiveQuery via queries.ts (reactive, auto-updating).
 * This store only handles write operations.
 */

import { favoriteCollection, type LocalFavorite } from '$lib/data/local-store';
import { toFavorite, type Favorite } from '$lib/data/queries';

export const favoritesStore = {
	async add(quoteId: string) {
		const newFav: LocalFavorite = {
			id: crypto.randomUUID(),
			quoteId,
		};
		await favoriteCollection.insert(newFav);
	},

	async remove(quoteId: string, favorites: Favorite[]) {
		const fav = favorites.find((f) => f.quoteId === quoteId);
		if (fav) {
			await favoriteCollection.delete(fav.id);
		}
	},

	async toggle(quoteId: string, favorites: Favorite[]) {
		const exists = favorites.some((f) => f.quoteId === quoteId);
		if (exists) {
			await this.remove(quoteId, favorites);
		} else {
			await this.add(quoteId);
		}
	},
};
