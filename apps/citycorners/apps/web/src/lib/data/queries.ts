/**
 * Reactive Queries & Pure Filter Helpers for CityCorners
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	locationCollection,
	favoriteCollection,
	type LocalLocation,
	type LocalFavorite,
} from './local-store';

// ─── Live Query Hooks (call during component init) ──────────

/** All locations, sorted by name. Auto-updates on any change. */
export function useAllLocations() {
	return useLiveQueryWithDefault(async () => {
		return locationCollection.getAll(undefined, {
			sortBy: 'name',
			sortDirection: 'asc',
		});
	}, [] as LocalLocation[]);
}

/** All favorites. Auto-updates on any change. */
export function useAllFavorites() {
	return useLiveQueryWithDefault(async () => {
		return favoriteCollection.getAll();
	}, [] as LocalFavorite[]);
}

// ─── Pure Filter Functions (for $derived) ───────────────────

/** Get a Set of favorite location IDs for quick lookup. */
export function getFavoriteIds(favorites: LocalFavorite[]): Set<string> {
	return new Set(favorites.map((f) => f.locationId));
}

/** Check if a location is favorited. */
export function isFavorite(favorites: LocalFavorite[], locationId: string): boolean {
	return favorites.some((f) => f.locationId === locationId);
}

/** Filter locations by category. */
export function filterByCategory(
	locations: LocalLocation[],
	category: string | null
): LocalLocation[] {
	if (!category) return locations;
	return locations.filter((l) => l.category === category);
}

/** Filter locations by search query across name, description, address. */
export function searchLocations(locations: LocalLocation[], query: string): LocalLocation[] {
	if (!query.trim()) return locations;
	const search = query.toLowerCase().trim();
	return locations.filter(
		(l) =>
			l.name.toLowerCase().includes(search) ||
			l.description?.toLowerCase().includes(search) ||
			l.address?.toLowerCase().includes(search)
	);
}
