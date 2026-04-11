/**
 * Geocoding routes — thin proxy to Pelias with caching and
 * OSM category mapping.
 *
 * Endpoints:
 *   GET /api/v1/geocode/search?q=...&limit=5       — forward (autocomplete)
 *   GET /api/v1/geocode/reverse?lat=...&lon=...     — reverse
 */

import { Hono } from 'hono';
import type { Config } from '../config';
import { LRUCache } from '../lib/cache';
import { mapPeliasToPlaceCategory, type PlaceCategory } from '../lib/category-map';

/** Normalized result returned to the client */
export interface GeocodingResult {
	/** Display name (e.g. "Münster Café, Münsterplatz 3, Konstanz") */
	label: string;
	/** Short name (e.g. "Münster Café") */
	name: string;
	latitude: number;
	longitude: number;
	/** Structured address components */
	address: {
		street?: string;
		houseNumber?: string;
		postalCode?: string;
		city?: string;
		state?: string;
		country?: string;
	};
	/** Our Places category, derived from Pelias taxonomy */
	category: PlaceCategory;
	/** Raw Pelias categories (food, retail, transport, …) */
	peliasCategories?: string[];
	/** Pelias confidence score 0-1 */
	confidence: number;
}

export function createGeocodeRoutes(config: Config) {
	const app = new Hono();
	const searchCache = new LRUCache<GeocodingResult[]>(config.cache.maxEntries, config.cache.ttlMs);
	const reverseCache = new LRUCache<GeocodingResult[]>(config.cache.maxEntries, config.cache.ttlMs);

	/**
	 * Forward geocoding / autocomplete
	 * GET /search?q=Münsterplatz+Konstanz&limit=5&lang=de
	 */
	app.get('/search', async (c) => {
		const q = c.req.query('q');
		if (!q || q.trim().length < 2) {
			return c.json({ results: [] });
		}

		const limit = Math.min(parseInt(c.req.query('limit') || '5', 10), 20);
		const lang = c.req.query('lang') || 'de';
		const focusLat = c.req.query('focus.lat');
		const focusLon = c.req.query('focus.lon');

		const cacheKey = `${q}|${limit}|${lang}|${focusLat}|${focusLon}`;
		const cached = searchCache.get(cacheKey);
		if (cached) {
			return c.json({ results: cached, cached: true });
		}

		// Note: we don't set boundary.country — the Pelias index only
		// contains DACH data, so everything is implicitly DE/AT/CH.
		const params = new URLSearchParams({
			text: q.trim(),
			size: String(limit),
			lang,
		});

		// Bias results towards a focus point (user's current location)
		if (focusLat && focusLon) {
			params.set('focus.point.lat', focusLat);
			params.set('focus.point.lon', focusLon);
		}

		// Query Pelias /autocomplete first (fast, fuzzy, good for venue names).
		// Autocomplete intentionally excludes the address layer as a perf
		// optimization, so if it returns nothing we fall back to /search which
		// covers streets/addresses too. This gives us the best of both worlds:
		// quick venue matches for names like "Konzil Restaurant" AND reliable
		// address matches for queries like "Marktstätte Konstanz".
		let features: PeliasFeature[] = [];
		const autocompleteRes = await fetch(`${config.pelias.apiUrl}/autocomplete?${params}`);
		if (autocompleteRes.ok) {
			const data = (await autocompleteRes.json()) as PeliasResponse;
			features = data.features;
		}

		if (features.length === 0) {
			const searchRes = await fetch(`${config.pelias.apiUrl}/search?${params}`);
			if (searchRes.ok) {
				const data = (await searchRes.json()) as PeliasResponse;
				features = data.features;
			} else if (!autocompleteRes.ok) {
				console.error(
					`Pelias error: autocomplete=${autocompleteRes.status} search=${searchRes.status}`
				);
				return c.json({ results: [], error: 'geocoding_unavailable' }, 502);
			}
		}

		const results = features.map(normalizePeliasFeature);
		searchCache.set(cacheKey, results);
		return c.json({ results });
	});

	/**
	 * Reverse geocoding
	 * GET /reverse?lat=47.663&lon=9.175&lang=de
	 */
	app.get('/reverse', async (c) => {
		const lat = c.req.query('lat');
		const lon = c.req.query('lon');
		if (!lat || !lon) {
			return c.json({ error: 'lat and lon are required' }, 400);
		}

		const lang = c.req.query('lang') || 'de';

		// Round to 5 decimal places (~1m precision) for cache hits
		const roundedLat = parseFloat(lat).toFixed(5);
		const roundedLon = parseFloat(lon).toFixed(5);
		const cacheKey = `${roundedLat}|${roundedLon}|${lang}`;

		const cached = reverseCache.get(cacheKey);
		if (cached) {
			return c.json({ results: cached, cached: true });
		}

		const params = new URLSearchParams({
			'point.lat': roundedLat,
			'point.lon': roundedLon,
			size: '3',
			lang,
		});

		const response = await fetch(`${config.pelias.apiUrl}/reverse?${params}`);
		if (!response.ok) {
			console.error(`Pelias reverse error: ${response.status} ${response.statusText}`);
			return c.json({ results: [], error: 'geocoding_unavailable' }, 502);
		}

		const data = (await response.json()) as PeliasResponse;
		const results = data.features.map(normalizePeliasFeature);

		reverseCache.set(cacheKey, results);
		return c.json({ results });
	});

	/**
	 * Cache stats (for monitoring)
	 * GET /stats
	 */
	app.get('/stats', (c) => {
		return c.json({
			searchCacheSize: searchCache.size,
			reverseCacheSize: reverseCache.size,
		});
	});

	return app;
}

// --- Pelias response types ---

interface PeliasResponse {
	type: 'FeatureCollection';
	features: PeliasFeature[];
}

interface PeliasFeature {
	type: 'Feature';
	geometry: {
		type: 'Point';
		coordinates: [number, number]; // [lon, lat]
	};
	properties: {
		id?: string;
		name?: string;
		label?: string;
		confidence?: number;
		layer?: string;
		street?: string;
		housenumber?: string;
		postalcode?: string;
		locality?: string;
		region?: string;
		country?: string;
		category?: string[];
	};
}

function normalizePeliasFeature(feature: PeliasFeature): GeocodingResult {
	const props = feature.properties;
	const [lon, lat] = feature.geometry.coordinates;

	return {
		label: props.label || props.name || '',
		name: props.name || '',
		latitude: lat,
		longitude: lon,
		address: {
			street: props.street,
			houseNumber: props.housenumber,
			postalCode: props.postalcode,
			city: props.locality,
			state: props.region,
			country: props.country,
		},
		category: mapPeliasToPlaceCategory(props.category, props.layer),
		peliasCategories: props.category,
		confidence: props.confidence ?? 0,
	};
}
