/**
 * Application configuration loaded from environment variables.
 */

export interface Config {
	port: number;
	pelias: {
		/** Pelias API base URL (the API container, not the placeholder service) */
		apiUrl: string;
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
}

export function loadConfig(): Config {
	return {
		port: parseInt(process.env.PORT || '3018', 10),
		pelias: {
			apiUrl: process.env.PELIAS_API_URL || 'http://localhost:4000/v1',
		},
		cors: {
			origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
		},
		cache: {
			maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || '5000', 10),
			ttlMs: parseInt(process.env.CACHE_TTL_MS || String(24 * 60 * 60 * 1000), 10),
		},
	};
}
