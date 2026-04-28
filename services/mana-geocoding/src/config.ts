/**
 * Application configuration loaded from environment variables.
 */

import type { ProviderName } from './providers/types';

export interface Config {
	port: number;
	pelias: {
		/** Pelias API base URL (the API container, not the placeholder service) */
		apiUrl: string;
	};
	photon: {
		/** Photon base URL (defaults to public komoot endpoint) */
		apiUrl: string;
	};
	nominatim: {
		apiUrl: string;
		userAgent: string;
		/** Inter-request gap in ms. Public Nominatim policy is 1 req/sec — we
		 *  default to 1100 ms to leave headroom against clock drift. */
		intervalMs: number;
	};
	cors: {
		origins: string[];
	};
	cache: {
		/** Max entries in the in-memory LRU cache */
		maxEntries: number;
		/** TTL in milliseconds (default: 24h — geocoding results rarely change) */
		ttlMs: number;
	};
	providers: {
		/** Order matters — the chain tries them top-down. Anything not in
		 *  this list is disabled. */
		enabled: ProviderName[];
		/** TTL for the per-provider health cache. */
		healthCacheMs: number;
		/** Wall-clock timeout per provider attempt (a slow provider falls
		 *  through to the next one). */
		timeoutMs: number;
	};
}

export function loadConfig(): Config {
	return {
		port: parseInt(process.env.PORT || '3018', 10),
		pelias: {
			apiUrl: process.env.PELIAS_API_URL || 'http://localhost:4000/v1',
		},
		photon: {
			apiUrl: process.env.PHOTON_API_URL || 'https://photon.komoot.io',
		},
		nominatim: {
			apiUrl: process.env.NOMINATIM_API_URL || 'https://nominatim.openstreetmap.org',
			userAgent:
				process.env.NOMINATIM_USER_AGENT ||
				'mana-geocoding/1.0 (+https://mana.how; kontakt@memoro.ai)',
			intervalMs: parseInt(process.env.NOMINATIM_INTERVAL_MS || '1100', 10),
		},
		cors: {
			origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
		},
		cache: {
			maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || '5000', 10),
			ttlMs: parseInt(process.env.CACHE_TTL_MS || String(24 * 60 * 60 * 1000), 10),
		},
		providers: {
			enabled: parseProviderList(process.env.GEOCODING_PROVIDERS, [
				'pelias',
				'photon',
				'nominatim',
			]),
			healthCacheMs: parseInt(process.env.PROVIDER_HEALTH_CACHE_MS || '30000', 10),
			timeoutMs: parseInt(process.env.PROVIDER_TIMEOUT_MS || '5000', 10),
		},
	};
}

function parseProviderList(raw: string | undefined, fallback: ProviderName[]): ProviderName[] {
	if (!raw) return fallback;
	const valid: ProviderName[] = ['pelias', 'photon', 'nominatim'];
	const parsed = raw
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter((s): s is ProviderName => (valid as string[]).includes(s));
	return parsed.length > 0 ? parsed : fallback;
}
