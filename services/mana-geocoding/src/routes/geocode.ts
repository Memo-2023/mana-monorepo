/**
 * Geocoding routes — thin proxy to the provider chain with caching.
 *
 * Endpoints:
 *   GET /api/v1/geocode/search?q=...&limit=5       — forward (autocomplete)
 *   GET /api/v1/geocode/reverse?lat=...&lon=...     — reverse
 *   GET /api/v1/geocode/stats                       — cache + provider stats
 */

import { Hono } from 'hono';
import type { Config } from '../config';
import { LRUCache } from '../lib/cache';
import type { ProviderChain } from '../providers/chain';
import type { GeocodingResult, ProviderName } from '../providers/types';

interface CachedAnswer {
	results: GeocodingResult[];
	provider: ProviderName | undefined;
}

export function createGeocodeRoutes(config: Config, chain: ProviderChain) {
	const app = new Hono();
	const searchCache = new LRUCache<CachedAnswer>(config.cache.maxEntries, config.cache.ttlMs);
	const reverseCache = new LRUCache<CachedAnswer>(config.cache.maxEntries, config.cache.ttlMs);

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
			return c.json({
				results: cached.results,
				cached: true,
				provider: cached.provider,
			});
		}

		const response = await chain.search({ q, limit, lang, focusLat, focusLon });
		if (!response.ok) {
			return c.json({ results: [], error: 'geocoding_unavailable', tried: response.tried }, 502);
		}

		searchCache.set(cacheKey, { results: response.results, provider: response.provider });
		return c.json({
			results: response.results,
			provider: response.provider,
			tried: response.tried,
		});
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
			return c.json({
				results: cached.results,
				cached: true,
				provider: cached.provider,
			});
		}

		const response = await chain.reverse({ lat: roundedLat, lon: roundedLon, lang });
		if (!response.ok) {
			return c.json({ results: [], error: 'geocoding_unavailable', tried: response.tried }, 502);
		}

		reverseCache.set(cacheKey, { results: response.results, provider: response.provider });
		return c.json({
			results: response.results,
			provider: response.provider,
			tried: response.tried,
		});
	});

	/**
	 * Cache + provider stats (for monitoring + manual debug).
	 * GET /stats
	 */
	app.get('/stats', (c) => {
		return c.json({
			searchCacheSize: searchCache.size,
			reverseCacheSize: reverseCache.size,
			providers: chain.getHealthSnapshot(),
		});
	});

	return app;
}
