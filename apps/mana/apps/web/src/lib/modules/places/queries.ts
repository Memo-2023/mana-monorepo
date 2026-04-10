/**
 * Reactive queries & pure helpers for Places — uses Dexie liveQuery on the unified DB.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import type { LocalPlace, LocalLocationLog, Place, LocationLog } from './types';

// ─── Type Converters ─────────────────────────────────────

export function toPlace(local: LocalPlace): Place {
	return {
		id: local.id,
		name: local.name,
		description: local.description || null,
		latitude: local.latitude,
		longitude: local.longitude,
		address: local.address || null,
		category: local.category ?? 'other',
		isFavorite: local.isFavorite ?? false,
		isArchived: local.isArchived ?? false,
		visitCount: local.visitCount ?? 0,
		lastVisitedAt: local.lastVisitedAt || null,
		tagIds: local.tagIds ?? [],
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toLocationLog(local: LocalLocationLog): LocationLog {
	return {
		id: local.id,
		latitude: local.latitude,
		longitude: local.longitude,
		accuracy: local.accuracy ?? null,
		altitude: local.altitude ?? null,
		speed: local.speed ?? null,
		heading: local.heading ?? null,
		timestamp: local.timestamp,
		placeId: local.placeId || null,
	};
}

// ─── Live Queries ────────────────────────────────────────

export function useAllPlaces() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalPlace>('places').toArray();
		const visible = locals.filter((p) => !p.deletedAt);
		const decrypted = await decryptRecords<LocalPlace>('places', visible);
		return decrypted.map(toPlace);
	}, []);
}

export function useLocationLogs(placeId?: string) {
	return useLiveQueryWithDefault(async () => {
		let query = db.table<LocalLocationLog>('locationLogs').orderBy('timestamp').reverse();
		const locals = await query.toArray();
		const filtered = placeId ? locals.filter((l) => l.placeId === placeId) : locals;
		const decrypted = await decryptRecords<LocalLocationLog>('locationLogs', filtered);
		return decrypted.map(toLocationLog);
	}, []);
}

// ─── Pure Filter / Search ────────────────────────────────

export function searchPlaces(places: Place[], query: string): Place[] {
	if (!query.trim()) return places;
	const q = query.toLowerCase().trim();
	return places.filter(
		(p) =>
			p.name.toLowerCase().includes(q) ||
			p.address?.toLowerCase().includes(q) ||
			p.category.toLowerCase().includes(q)
	);
}

export function filterFavorites(places: Place[]): Place[] {
	return places.filter((p) => p.isFavorite);
}

export function filterActive(places: Place[]): Place[] {
	return places.filter((p) => !p.isArchived);
}

/**
 * Haversine distance between two coordinates in kilometers.
 */
export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find the nearest known place within a given radius (km).
 */
export function findNearestPlace(
	places: Place[],
	lat: number,
	lng: number,
	radiusKm = 0.1
): Place | null {
	let nearest: Place | null = null;
	let minDist = radiusKm;
	for (const p of places) {
		const d = getDistanceKm(lat, lng, p.latitude, p.longitude);
		if (d < minDist) {
			minDist = d;
			nearest = p;
		}
	}
	return nearest;
}
