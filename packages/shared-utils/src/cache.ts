/**
 * IndexedDB Cache Utility
 * Provides persistent storage for cached data like signed URLs
 * Survives page reloads and provides better performance than localStorage
 */

interface CacheEntry<T = string> {
	id: string;
	data: T;
	expires: number;
	createdAt: number;
}

interface CacheConfig {
	/** Database name */
	dbName: string;
	/** Store name */
	storeName: string;
	/** Database version */
	version?: number;
}

let dbPromises: Map<string, Promise<IDBDatabase>> = new Map();

/**
 * Initialize IndexedDB connection
 */
function getDB(config: CacheConfig): Promise<IDBDatabase> {
	const key = `${config.dbName}:${config.storeName}`;

	if (dbPromises.has(key)) {
		return dbPromises.get(key)!;
	}

	const promise = new Promise<IDBDatabase>((resolve, reject) => {
		if (typeof indexedDB === 'undefined') {
			reject(new Error('IndexedDB not available'));
			return;
		}

		const request = indexedDB.open(config.dbName, config.version || 1);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			// Create store if it doesn't exist
			if (!db.objectStoreNames.contains(config.storeName)) {
				const store = db.createObjectStore(config.storeName, { keyPath: 'id' });
				store.createIndex('expires', 'expires', { unique: false });
			}
		};
	});

	dbPromises.set(key, promise);
	return promise;
}

/**
 * Create a cache instance for a specific database/store
 */
export function createCache<T = string>(config: CacheConfig) {
	return {
		/**
		 * Get cached data by ID
		 * Returns null if not found or expired
		 */
		async get(id: string): Promise<T | null> {
			try {
				const db = await getDB(config);
				const transaction = db.transaction(config.storeName, 'readonly');
				const store = transaction.objectStore(config.storeName);

				return new Promise((resolve) => {
					const request = store.get(id);

					request.onsuccess = () => {
						const result = request.result as CacheEntry<T> | undefined;
						if (result && Date.now() < result.expires) {
							resolve(result.data);
						} else {
							resolve(null);
						}
					};

					request.onerror = () => {
						console.error('Error getting cached data:', request.error);
						resolve(null);
					};
				});
			} catch {
				return null;
			}
		},

		/**
		 * Store data in cache
		 * @param id - Unique identifier for the cached data
		 * @param data - Data to cache
		 * @param expiresInMs - Time until expiration in milliseconds
		 */
		async set(id: string, data: T, expiresInMs: number): Promise<void> {
			try {
				const db = await getDB(config);
				const transaction = db.transaction(config.storeName, 'readwrite');
				const store = transaction.objectStore(config.storeName);

				const entry: CacheEntry<T> = {
					id,
					data,
					expires: Date.now() + expiresInMs,
					createdAt: Date.now(),
				};

				store.put(entry);
			} catch (error) {
				console.error('Error caching data:', error);
			}
		},

		/**
		 * Delete cached data by ID
		 */
		async delete(id: string): Promise<void> {
			try {
				const db = await getDB(config);
				const transaction = db.transaction(config.storeName, 'readwrite');
				const store = transaction.objectStore(config.storeName);
				store.delete(id);
			} catch (error) {
				console.error('Error deleting cached data:', error);
			}
		},

		/**
		 * Clean up expired entries
		 * Should be called periodically
		 */
		async cleanupExpired(): Promise<void> {
			try {
				const db = await getDB(config);
				const transaction = db.transaction(config.storeName, 'readwrite');
				const store = transaction.objectStore(config.storeName);
				const index = store.index('expires');
				const now = Date.now();

				const request = index.openCursor(IDBKeyRange.upperBound(now));

				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest).result;
					if (cursor) {
						cursor.delete();
						cursor.continue();
					}
				};
			} catch (error) {
				console.error('Error cleaning up expired entries:', error);
			}
		},

		/**
		 * Clear all cached data
		 */
		async clear(): Promise<void> {
			try {
				const db = await getDB(config);
				const transaction = db.transaction(config.storeName, 'readwrite');
				const store = transaction.objectStore(config.storeName);
				store.clear();
			} catch (error) {
				console.error('Error clearing cache:', error);
			}
		},

		/**
		 * Check if an item exists and is not expired
		 */
		async has(id: string): Promise<boolean> {
			const data = await this.get(id);
			return data !== null;
		},
	};
}

// Default URL cache for signed URLs (like Supabase storage URLs)
const DEFAULT_URL_CACHE_CONFIG: CacheConfig = {
	dbName: 'manacore-cache',
	storeName: 'urls',
	version: 1,
};

/**
 * Pre-configured cache for signed URLs
 * Useful for caching Supabase storage signed URLs
 */
export const urlCache = createCache<string>(DEFAULT_URL_CACHE_CONFIG);

// Convenience exports for URL caching (backward compatibility)
export const getCachedUrl = urlCache.get.bind(urlCache);
export const setCachedUrl = urlCache.set.bind(urlCache);
export const deleteCachedUrl = urlCache.delete.bind(urlCache);
export const cleanupExpiredUrls = urlCache.cleanupExpired.bind(urlCache);
export const clearAllCachedUrls = urlCache.clear.bind(urlCache);
