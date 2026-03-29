/**
 * CityCorners — Local-First Data Layer
 *
 * Cities, locations, and favorites stored locally for offline browsing.
 * Location lookup and web search remain server-side.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestCities, guestLocations } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalCity extends BaseRecord {
	name: string;
	slug: string;
	country: string;
	state?: string | null;
	description?: string | null;
	latitude: number;
	longitude: number;
	imageUrl?: string | null;
	createdBy?: string | null;
}

export interface LocalLocation extends BaseRecord {
	cityId: string;
	name: string;
	category:
		| 'sight'
		| 'restaurant'
		| 'shop'
		| 'museum'
		| 'cafe'
		| 'bar'
		| 'park'
		| 'beach'
		| 'hotel'
		| 'event_venue'
		| 'viewpoint';
	description?: string | null;
	address?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	imageUrl?: string | null;
	timeline?: Array<{ year: number; event: string }> | null;
}

export interface LocalFavorite extends BaseRecord {
	locationId: string;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const citycornersStore = createLocalStore({
	appId: 'citycorners',
	collections: [
		{
			name: 'cities',
			indexes: ['slug', 'country', 'name'],
			guestSeed: guestCities,
		},
		{
			name: 'locations',
			indexes: ['cityId', 'category', 'name'],
			guestSeed: guestLocations,
		},
		{
			name: 'favorites',
			indexes: ['locationId'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const cityCollection = citycornersStore.collection<LocalCity>('cities');
export const locationCollection = citycornersStore.collection<LocalLocation>('locations');
export const favoriteCollection = citycornersStore.collection<LocalFavorite>('favorites');
