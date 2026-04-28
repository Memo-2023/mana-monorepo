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
import { isSensitiveQuery } from '../lib/sensitive-query';
import type { ChainNotice, ProviderChain } from '../providers/chain';
import type { GeocodingResult, ProviderName } from '../providers/types';

interface CachedAnswer {
	results: GeocodingResult[];
	provider: ProviderName | undefined;
	notice?: ChainNotice;
}

/**
 * TTL chooser. Public-API results (Photon/Nominatim) get the longer TTL —
 * caching aggressively is the main privacy lever once the query has
 * already left our network. Local results stay on the shorter TTL because
 * the Pelias index can be re-imported; we don't want stale local data.
 *
 * Sensitive-query notices are cached on the short TTL too (the user might
 * retry from a different angle quickly), and `undefined` provider (chain
 * served-empty case) defaults to local TTL.
 */
function ttlFor(provider: ProviderName | undefined, config: Config): number {
	if (provider === 'photon' || provider === 'nominatim') return config.cache.publicTtlMs;
	return config.cache.ttlMs;
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

		// Sensitive-query check happens BEFORE the cache lookup. The cache
		// key includes focus coords; we want the privacy decision baked into
		// the cached value, not retroactively flipped if the keyword list
		// changes. Cached entries from prior sensitive queries are fine —
		// they were stored from a localOnly run.
		const sensitivity = isSensitiveQuery(q);

		const cacheKey = `${q}|${limit}|${lang}|${focusLat}|${focusLon}`;
		const cached = searchCache.get(cacheKey);
		if (cached) {
			return c.json({
				results: cached.results,
				cached: true,
				provider: cached.provider,
				...(cached.notice ? { notice: cached.notice } : {}),
			});
		}

		const response = await chain.search({ q, limit, lang, focusLat, focusLon }, undefined, {
			localOnly: sensitivity.sensitive,
		});
		if (!response.ok) {
			return c.json({ results: [], error: 'geocoding_unavailable', tried: response.tried }, 502);
		}

		searchCache.set(
			cacheKey,
			{
				results: response.results,
				provider: response.provider,
				notice: response.notice,
			},
			ttlFor(response.provider, config)
		);
		return c.json({
			results: response.results,
			provider: response.provider,
			tried: response.tried,
			...(response.notice ? { notice: response.notice } : {}),
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
				...(cached.notice ? { notice: cached.notice } : {}),
			});
		}

		// Reverse geocoding has no query string to classify, so no
		// sensitive-keyword check applies — the privacy lever here is the
		// quantization that happens inside the public providers (Photon
		// and Nominatim round to ~110 m before forwarding).
		const response = await chain.reverse({ lat: roundedLat, lon: roundedLon, lang });
		if (!response.ok) {
			return c.json({ results: [], error: 'geocoding_unavailable', tried: response.tried }, 502);
		}

		reverseCache.set(
			cacheKey,
			{
				results: response.results,
				provider: response.provider,
				notice: response.notice,
			},
			ttlFor(response.provider, config)
		);
		return c.json({
			results: response.results,
			provider: response.provider,
			tried: response.tried,
			...(response.notice ? { notice: response.notice } : {}),
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
