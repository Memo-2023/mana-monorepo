/**
 * Simple in-memory LRU cache with TTL for geocoding results.
 * Geocoding results rarely change, so we cache to reduce load on
 * upstream providers.
 */

interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

export class LRUCache<T> {
	private map = new Map<string, CacheEntry<T>>();
	private maxEntries: number;
	private ttlMs: number;

	constructor(maxEntries: number, ttlMs: number) {
		this.maxEntries = maxEntries;
		this.ttlMs = ttlMs;
	}

	get(key: string): T | undefined {
		const entry = this.map.get(key);
		if (!entry) return undefined;

		if (Date.now() > entry.expiresAt) {
			this.map.delete(key);
			return undefined;
		}

		// Move to end (most recently used)
		this.map.delete(key);
		this.map.set(key, entry);
		return entry.value;
	}

	/**
	 * Insert or update a cache entry.
	 *
	 * @param ttlOverrideMs Optional per-entry TTL. The route layer uses
	 *   this so public-fallback answers expire faster than local-provider
	 *   answers — see `ttlFor()` in routes/geocode.ts. When omitted, the
	 *   constructor's default TTL applies.
	 */
	set(key: string, value: T, ttlOverrideMs?: number): void {
		// Delete first so re-insert goes to end
		this.map.delete(key);

		// Evict oldest if at capacity
		if (this.map.size >= this.maxEntries) {
			const oldest = this.map.keys().next().value;
			if (oldest !== undefined) this.map.delete(oldest);
		}

		const ttl = ttlOverrideMs ?? this.ttlMs;
		this.map.set(key, {
			value,
			expiresAt: Date.now() + ttl,
		});
	}

	get size(): number {
		return this.map.size;
	}
}
