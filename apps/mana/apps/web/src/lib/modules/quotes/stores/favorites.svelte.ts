/**
 * Favorites Store — Mutation-only
 * Reads come from liveQuery via queries.ts (reactive, auto-updating).
 * This store only handles write operations.
 */

import { db } from '$lib/data/database';
import { getEffectiveSpaceId } from '$lib/data/scope';
import type { LocalFavorite } from '../types';
import type { Favorite } from '../queries';

export const favoritesStore = {
	async add(quoteId: string) {
		const now = new Date().toISOString();
		await db.table('quotesFavorites').add({
			id: crypto.randomUUID(),
			quoteId,
			spaceId: getEffectiveSpaceId(),
			createdAt: now,
			updatedAt: now,
		});
	},

	async remove(quoteId: string, favorites: Favorite[]) {
		const fav = favorites.find((f) => f.quoteId === quoteId);
		if (fav) {
			await db.table('quotesFavorites').update(fav.id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
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

	async setNotes(favoriteId: string, notes: string) {
		await db.table('quotesFavorites').update(favoriteId, {
			notes: notes || null,
			updatedAt: new Date().toISOString(),
		});
	},
};
