/**
 * Favorites Store — Mutation-Only
 *
 * All reads are handled by useLiveQuery (see $lib/data/queries.ts).
 * This store only exposes mutations that write to IndexedDB.
 * The live queries will automatically pick up the changes.
 */

import { favoriteCollection, type LocalFavorite } from '$lib/data/local-store';

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
			const all = await favoriteCollection.getAll();
			const existing = all.find((f) => f.locationId === locationId);

			if (existing) {
				await favoriteCollection.delete(existing.id);
			} else {
				const newFav: LocalFavorite = {
					id: crypto.randomUUID(),
					locationId,
				};
				await favoriteCollection.insert(newFav);
			}
		} catch (err) {
			console.error('Failed to toggle favorite:', err);
		} finally {
			loading = false;
		}
	},

	clear() {
		// Nothing to clear — reads come from liveQuery
	},
};
