/**
 * Unit tests for the LRU cache used by the geocoding wrapper.
 *
 * The cache is small and dependency-free but has three subtle behaviours
 * worth locking in: TTL expiry, LRU eviction order, and move-to-end on get.
 */

import { describe, it, expect } from 'bun:test';
import { LRUCache } from '../cache';

describe('LRUCache', () => {
	it('returns undefined for missing keys', () => {
		const cache = new LRUCache<string>(10, 60_000);
		expect(cache.get('missing')).toBeUndefined();
	});

	it('stores and retrieves values', () => {
		const cache = new LRUCache<string>(10, 60_000);
		cache.set('a', 'apple');
		expect(cache.get('a')).toBe('apple');
	});

	it('overwrites existing keys', () => {
		const cache = new LRUCache<string>(10, 60_000);
		cache.set('a', 'apple');
		cache.set('a', 'apricot');
		expect(cache.get('a')).toBe('apricot');
		expect(cache.size).toBe(1);
	});

	it('expires entries past their TTL', async () => {
		const cache = new LRUCache<string>(10, 20); // 20 ms TTL
		cache.set('a', 'apple');
		expect(cache.get('a')).toBe('apple');
		await new Promise((r) => setTimeout(r, 30));
		expect(cache.get('a')).toBeUndefined();
	});

	it('evicts the oldest entry when at capacity', () => {
		const cache = new LRUCache<string>(3, 60_000);
		cache.set('a', 'apple');
		cache.set('b', 'banana');
		cache.set('c', 'cherry');
		cache.set('d', 'date'); // should evict 'a'
		expect(cache.get('a')).toBeUndefined();
		expect(cache.get('b')).toBe('banana');
		expect(cache.get('c')).toBe('cherry');
		expect(cache.get('d')).toBe('date');
		expect(cache.size).toBe(3);
	});

	it('moves entries to the end on get (LRU order)', () => {
		const cache = new LRUCache<string>(3, 60_000);
		cache.set('a', 'apple');
		cache.set('b', 'banana');
		cache.set('c', 'cherry');
		// Touch 'a' so it becomes the most recently used
		expect(cache.get('a')).toBe('apple');
		// Now insert 'd' — 'b' should be evicted (oldest unused), not 'a'
		cache.set('d', 'date');
		expect(cache.get('a')).toBe('apple'); // still there
		expect(cache.get('b')).toBeUndefined(); // evicted
		expect(cache.get('c')).toBe('cherry');
		expect(cache.get('d')).toBe('date');
	});

	it('tracks size correctly through set/get/expiry', async () => {
		const cache = new LRUCache<number>(5, 20);
		expect(cache.size).toBe(0);
		cache.set('a', 1);
		cache.set('b', 2);
		expect(cache.size).toBe(2);
		// Expire
		await new Promise((r) => setTimeout(r, 30));
		// get() removes expired entries as a side effect
		cache.get('a');
		expect(cache.size).toBe(1); // only 'b' remains in the map until touched
		cache.get('b');
		expect(cache.size).toBe(0);
	});

	it('honors per-entry ttlOverride longer than the default', async () => {
		// Default TTL = 20ms; one entry overridden to 200ms.
		const cache = new LRUCache<string>(10, 20);
		cache.set('short', 'short-lived');
		cache.set('long', 'long-lived', 200);

		// Both alive at t=0
		expect(cache.get('short')).toBe('short-lived');
		expect(cache.get('long')).toBe('long-lived');

		// Past default TTL: short expires, long survives
		await new Promise((r) => setTimeout(r, 40));
		expect(cache.get('short')).toBeUndefined();
		expect(cache.get('long')).toBe('long-lived');
	});

	it('honors per-entry ttlOverride shorter than the default', async () => {
		// Inverse case: shorter override on one entry. Validates we use
		// the override value, not the larger of (default, override).
		const cache = new LRUCache<string>(10, 200);
		cache.set('default', 'A');
		cache.set('shortened', 'B', 20);

		await new Promise((r) => setTimeout(r, 40));
		expect(cache.get('default')).toBe('A');
		expect(cache.get('shortened')).toBeUndefined();
	});

	it('handles arbitrary value types', () => {
		interface Feature {
			name: string;
			lat: number;
		}
		const cache = new LRUCache<Feature[]>(10, 60_000);
		const results: Feature[] = [
			{ name: 'Konzil', lat: 47.66 },
			{ name: 'Il Boccone', lat: 47.658 },
		];
		cache.set('konstanz-restaurants', results);
		expect(cache.get('konstanz-restaurants')).toEqual(results);
	});
});
