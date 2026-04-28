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
		/** Photon base URL — public komoot endpoint by default. Used by
		 *  the `'photon'` provider slot which always has `privacy: 'public'`. */
		apiUrl: string;
	};
	photonSelf: {
		/** Self-hosted Photon URL (e.g. `http://192.168.178.11:2322` for the
		 *  GPU server). When set, the wrapper registers a separate
		 *  `'photon-self'` provider with `privacy: 'local'` — eligible for
		 *  sensitive queries. When undefined, the slot is disabled and the
		 *  chain only has the public providers (current pre-migration state). */
		apiUrl: string | undefined;
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
		/** Default TTL in milliseconds (24h — used for results from local
		 *  providers like Pelias, where the index can be re-imported) */
		ttlMs: number;
		/** Extended TTL for results that came from public APIs (Photon,
		 *  Nominatim). 7 days by default — caching aggressively reduces
		 *  the number of times we forward query content to a third party,
		 *  which is the main privacy lever we have over public providers. */
		publicTtlMs: number;
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
		photonSelf: {
			// Opt-in: only registered when this env-var is explicitly set
			// (e.g. http://192.168.178.11:2322 once the GPU server is up).
			// Empty string → treated as unset so a stray "" in .env doesn't
			// register a useless provider.
			apiUrl: process.env.PHOTON_SELF_API_URL?.trim() || undefined,
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
			publicTtlMs: parseInt(process.env.CACHE_PUBLIC_TTL_MS || String(7 * 24 * 60 * 60 * 1000), 10),
		},
		providers: {
			// Default order (when GEOCODING_PROVIDERS is unset): try the
			// self-hosted Photon first if it's been configured, then public
			// providers as fallback. `photon-self` is silently dropped at
			// chain-build time if `photonSelf.apiUrl` is undefined, so the
			// list is the same shape regardless of migration status.
			enabled: parseProviderList(process.env.GEOCODING_PROVIDERS, [
				'photon-self',
				'pelias',
				'photon',
				'nominatim',
			]),
			healthCacheMs: parseInt(process.env.PROVIDER_HEALTH_CACHE_MS || '30000', 10),
			// 8 s default. Nominatim's cold-start DNS+TLS handshake can push the
			// first health probe past the older 5 s default, false-marking the
			// provider unhealthy for the next 30 s. 8 s survives a slow first
			// probe but still cuts off actually-stuck connections.
			timeoutMs: parseInt(process.env.PROVIDER_TIMEOUT_MS || '8000', 10),
		},
	};
}

function parseProviderList(raw: string | undefined, fallback: ProviderName[]): ProviderName[] {
	if (!raw) return fallback;
	const valid: ProviderName[] = ['pelias', 'photon-self', 'photon', 'nominatim'];
	const parsed = raw
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter((s): s is ProviderName => (valid as string[]).includes(s));
	return parsed.length > 0 ? parsed : fallback;
}
