/**
 * Memoro IndexedDB Cache
 * Uses shared cache utilities with Memoro-specific configuration
 */

import { createCache } from '@manacore/shared-utils';

// Create Memoro-specific URL cache
const memoroUrlCache = createCache<string>({
	dbName: 'memoro-cache',
	storeName: 'audio-urls',
	version: 1
});

// Re-export with Memoro's original function names for backward compatibility
export const getCachedUrl = memoroUrlCache.get.bind(memoroUrlCache);
export const setCachedUrl = memoroUrlCache.set.bind(memoroUrlCache);
export const deleteCachedUrl = memoroUrlCache.delete.bind(memoroUrlCache);
export const cleanupExpiredUrls = memoroUrlCache.cleanupExpired.bind(memoroUrlCache);
export const clearAllCachedUrls = memoroUrlCache.clear.bind(memoroUrlCache);

// Also export the cache instance for advanced usage
export { memoroUrlCache };
