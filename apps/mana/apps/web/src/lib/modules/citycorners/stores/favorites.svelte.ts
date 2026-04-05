/**
 * Favorites Store — Mutation-Only
 *
 * All reads are handled by liveQuery (see queries.ts).
 * This store only exposes mutations that write to IndexedDB.
 */

import { db } from '$lib/data/database';
import { CityCornersEvents } from '@mana/shared-utils/analytics';
import type { LocalFavorite } from '../types';

let loading = $state(false);

export const favoritesStore = {
	get loading() {
		return loading;
	},

	/**
	 * Toggle a favorite — writes to / removes from IndexedDB instantly.
	 */
	async toggle(locationId: string) {
		loading = true;

		try {
			const all = await db.table<LocalFavorite>('ccFavorites').toArray();
			const existing = all.find((f) => f.locationId === locationId && !f.deletedAt);

			if (existing) {
				await db.table('ccFavorites').update(existing.id, {
					deletedAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				});
				CityCornersEvents.favoriteToggled(false);
			} else {
				const newFav: LocalFavorite = {
					id: crypto.randomUUID(),
					locationId,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
				await db.table('ccFavorites').add(newFav);
				CityCornersEvents.favoriteToggled(true);
			}
		} catch (err) {
			console.error('Failed to toggle favorite:', err);
		} finally {
			loading = false;
		}
	},
};
