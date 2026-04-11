/**
 * Geocoding client for the Places module.
 *
 * Talks to our self-hosted mana-geocoding service (Pelias-backed).
 * All queries stay within our infrastructure — no location data
 * leaves the network.
 */

import type { PlaceCategory } from './types';

const GEOCODING_URL = () => {
	if (typeof window !== 'undefined') {
		const injected = (window as unknown as { __PUBLIC_MANA_GEOCODING_URL__?: string })
			.__PUBLIC_MANA_GEOCODING_URL__;
		if (injected) return injected;
	}
	return import.meta.env.PUBLIC_MANA_GEOCODING_URL ?? 'http://localhost:3018';
};

export interface GeocodingResult {
	label: string;
	name: string;
	latitude: number;
	longitude: number;
	address: {
		street?: string;
		houseNumber?: string;
		postalCode?: string;
		city?: string;
		state?: string;
		country?: string;
	};
	category: PlaceCategory;
	/** Raw Pelias categories (food, retail, transport, …) */
	peliasCategories?: string[];
	confidence: number;
}

interface GeocodingResponse {
	results: GeocodingResult[];
	cached?: boolean;
	error?: string;
}

/**
 * Forward geocoding / autocomplete.
 * Returns places matching the search query, biased towards the focus point.
 */
export async function searchAddress(
	query: string,
	options?: {
		limit?: number;
		focusLat?: number;
		focusLon?: number;
		lang?: string;
	}
): Promise<GeocodingResult[]> {
	if (!query || query.trim().length < 2) return [];

	const params = new URLSearchParams({ q: query.trim() });
	if (options?.limit) params.set('limit', String(options.limit));
	if (options?.lang) params.set('lang', options.lang);
	if (options?.focusLat != null) params.set('focus.lat', String(options.focusLat));
	if (options?.focusLon != null) params.set('focus.lon', String(options.focusLon));

	try {
		const res = await fetch(`${GEOCODING_URL()}/api/v1/geocode/search?${params}`);
		if (!res.ok) return [];
		const data: GeocodingResponse = await res.json();
		return data.results;
	} catch {
		console.warn('Geocoding search failed — service may be offline');
		return [];
	}
}

/**
 * Reverse geocoding — resolve coordinates to an address and place type.
 */
export async function reverseGeocode(
	lat: number,
	lon: number,
	lang = 'de'
): Promise<GeocodingResult | null> {
	try {
		const params = new URLSearchParams({
			lat: String(lat),
			lon: String(lon),
			lang,
		});
		const res = await fetch(`${GEOCODING_URL()}/api/v1/geocode/reverse?${params}`);
		if (!res.ok) return null;
		const data: GeocodingResponse = await res.json();
		return data.results[0] ?? null;
	} catch {
		console.warn('Reverse geocoding failed — service may be offline');
		return null;
	}
}

/**
 * Format a structured address into a single-line string.
 */
export function formatAddress(address: GeocodingResult['address']): string {
	const parts: string[] = [];

	if (address.street) {
		parts.push(address.houseNumber ? `${address.street} ${address.houseNumber}` : address.street);
	}
	if (address.postalCode && address.city) {
		parts.push(`${address.postalCode} ${address.city}`);
	} else if (address.city) {
		parts.push(address.city);
	}

	return parts.join(', ');
}
