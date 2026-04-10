/**
 * Reactive Queries & Pure Filter Helpers for CityCorners
 *
 * Uses Dexie liveQuery on the unified DB. Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import type { LocalCity, LocalLocation, LocalFavorite } from './types';

// ─── Live Query Hooks ─────────────────────────────────────
//
// Each hook returns `{ value, loading, error }` — call sites read
// `.value` reactively (the wrapper internally manages a `$state`
// snapshot synced to the underlying Dexie liveQuery). MUST be called
// from inside a component setup, never from a module-level constant.

/** All cities, sorted by name. Auto-updates on any change. */
export function useAllCities() {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalCity>('cities').toArray();
		return all.filter((c) => !c.deletedAt).sort((a, b) => a.name.localeCompare(b.name));
	}, [] as LocalCity[]);
}

/** All locations, sorted by name. Auto-updates on any change. */
export function useAllLocations() {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalLocation>('ccLocations').toArray();
		return all.filter((l) => !l.deletedAt).sort((a, b) => a.name.localeCompare(b.name));
	}, [] as LocalLocation[]);
}

/** All favorites. Auto-updates on any change. */
export function useAllFavorites() {
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalFavorite>('ccFavorites').toArray();
		return all.filter((f) => !f.deletedAt);
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

/** Filter locations by city. */
export function filterByCity(locations: LocalLocation[], cityId: string): LocalLocation[] {
	return locations.filter((l) => l.cityId === cityId);
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

/** Filter cities by search query across name, country, state, description. */
export function searchCities(cities: LocalCity[], query: string): LocalCity[] {
	if (!query.trim()) return cities;
	const search = query.toLowerCase().trim();
	return cities.filter(
		(c) =>
			c.name.toLowerCase().includes(search) ||
			c.country.toLowerCase().includes(search) ||
			c.state?.toLowerCase().includes(search) ||
			c.description?.toLowerCase().includes(search)
	);
}

/** Find a city by slug. */
export function findCityBySlug(cities: LocalCity[], slug: string): LocalCity | undefined {
	return cities.find((c) => c.slug === slug);
}

/** Count locations per city. */
export function getLocationCountByCity(locations: LocalLocation[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const loc of locations) {
		counts.set(loc.cityId, (counts.get(loc.cityId) || 0) + 1);
	}
	return counts;
}

/** Stats for a single city. */
export interface CityStats {
	locationCount: number;
	categoryCounts: Record<string, number>;
	topCategories: { category: string; count: number }[];
	contributorCount: number;
	hasCoordinates: number;
	recentLocations: LocalLocation[];
}

/** Compute stats for a city's locations. */
export function getCityStats(locations: LocalLocation[]): CityStats {
	const categoryCounts: Record<string, number> = {};
	const contributors = new Set<string>();
	let hasCoordinates = 0;

	for (const loc of locations) {
		categoryCounts[loc.category] = (categoryCounts[loc.category] || 0) + 1;
		if (loc.createdBy) contributors.add(loc.createdBy);
		if (loc.latitude && loc.longitude) hasCoordinates++;
	}

	const topCategories = Object.entries(categoryCounts)
		.map(([category, count]) => ({ category, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);

	const recentLocations = [...locations]
		.sort((a, b) => {
			const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
			const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
			return bTime - aTime;
		})
		.slice(0, 3);

	return {
		locationCount: locations.length,
		categoryCounts,
		topCategories,
		contributorCount: contributors.size,
		hasCoordinates,
		recentLocations,
	};
}

/** Stats summary for the city discovery page. */
export interface PlatformStats {
	totalCities: number;
	totalLocations: number;
	totalContributors: number;
}

/** Compute platform-wide stats. */
export function getPlatformStats(cities: LocalCity[], locations: LocalLocation[]): PlatformStats {
	const contributors = new Set<string>();
	for (const loc of locations) {
		if (loc.createdBy) contributors.add(loc.createdBy);
	}
	for (const city of cities) {
		if (city.createdBy) contributors.add(city.createdBy);
	}
	return {
		totalCities: cities.length,
		totalLocations: locations.length,
		totalContributors: contributors.size,
	};
}
