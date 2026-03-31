/**
 * IndexedDB Cache for persistent storage of signed URLs
 * Survives page reloads and provides better performance
 */

const DB_NAME = 'memoro-cache';
const DB_VERSION = 1;
const STORE_NAME = 'audio-urls';

interface CachedUrl {
	id: string;
	url: string;
	expires: number;
	createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB connection
 */
function getDB(): Promise<IDBDatabase> {
	if (dbPromise) return dbPromise;

	dbPromise = new Promise((resolve, reject) => {
		if (typeof indexedDB === 'undefined') {
			reject(new Error('IndexedDB not available'));
			return;
		}

		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			// Create store if it doesn't exist
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
				store.createIndex('expires', 'expires', { unique: false });
			}
		};
	});

	return dbPromise;
}

/**
 * Get cached URL from IndexedDB
 */
export async function getCachedUrl(id: string): Promise<string | null> {
	try {
		const db = await getDB();
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);

		return new Promise((resolve) => {
			const request = store.get(id);

			request.onsuccess = () => {
				const result = request.result as CachedUrl | undefined;
				if (result && Date.now() < result.expires) {
					resolve(result.url);
				} else {
					resolve(null);
				}
			};

			request.onerror = () => {
				console.error('Error getting cached URL:', request.error);
				resolve(null);
			};
		});
	} catch {
		return null;
	}
}

/**
 * Store URL in IndexedDB cache
 */
export async function setCachedUrl(id: string, url: string, expiresInMs: number): Promise<void> {
	try {
		const db = await getDB();
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);

		const entry: CachedUrl = {
			id,
			url,
			expires: Date.now() + expiresInMs,
			createdAt: Date.now(),
		};

		store.put(entry);
	} catch (error) {
		console.error('Error caching URL:', error);
	}
}

/**
 * Delete cached URL from IndexedDB
 */
export async function deleteCachedUrl(id: string): Promise<void> {
	try {
		const db = await getDB();
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		store.delete(id);
	} catch (error) {
		console.error('Error deleting cached URL:', error);
	}
}

/**
 * Clean up expired entries from IndexedDB
 * Should be called periodically
 */
export async function cleanupExpiredUrls(): Promise<void> {
	try {
		const db = await getDB();
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
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
		console.error('Error cleaning up expired URLs:', error);
	}
}

/**
 * Clear all cached URLs
 */
export async function clearAllCachedUrls(): Promise<void> {
	try {
		const db = await getDB();
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		store.clear();
	} catch (error) {
		console.error('Error clearing cache:', error);
	}
}
