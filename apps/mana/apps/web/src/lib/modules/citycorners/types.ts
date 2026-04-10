/**
 * CityCorners module types for the unified app.
 */

import type { BaseRecord } from '@mana/local-store';

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
	createdBy?: string | null;
}

export interface LocalFavorite extends BaseRecord {
	locationId: string;
}

export const CATEGORY_KEYS = [
	'sight',
	'restaurant',
	'shop',
	'museum',
	'cafe',
	'bar',
	'park',
	'beach',
	'hotel',
	'event_venue',
	'viewpoint',
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
	sight: '#2563eb',
	restaurant: '#dc2626',
	shop: '#16a34a',
	museum: '#9333ea',
	cafe: '#b45309',
	bar: '#ea580c',
	park: '#15803d',
	beach: '#0891b2',
	hotel: '#4f46e5',
	event_venue: '#db2777',
	viewpoint: '#0ea5e9',
};
