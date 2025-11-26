import { describe, test, expect, beforeEach, vi } from 'vitest';
import { cache, cacheKey, CacheKeys } from './cache';

describe('Cache System', () => {
	beforeEach(() => {
		cache.clear();
	});

	describe('Basic Cache Operations', () => {
		test('should set and get values', () => {
			const key = 'test-key';
			const value = { data: 'test' };

			cache.set(key, value);
			const result = cache.get(key);

			expect(result).toEqual(value);
		});

		test('should return null for non-existent keys', () => {
			const result = cache.get('non-existent');
			expect(result).toBeNull();
		});

		test('should handle TTL expiration', async () => {
			const key = 'ttl-test';
			const value = 'test-value';
			const shortTTL = 10; // 10ms

			cache.set(key, value, shortTTL);
			
			// Should be available immediately
			expect(cache.get(key)).toBe(value);

			// Wait for TTL to expire
			await new Promise(resolve => setTimeout(resolve, 20));
			
			// Should be null after expiration
			expect(cache.get(key)).toBeNull();
		});

		test('should delete specific keys', () => {
			cache.set('key1', 'value1');
			cache.set('key2', 'value2');

			cache.delete('key1');

			expect(cache.get('key1')).toBeNull();
			expect(cache.get('key2')).toBe('value2');
		});

		test('should clear all keys', () => {
			cache.set('key1', 'value1');
			cache.set('key2', 'value2');

			cache.clear();

			expect(cache.get('key1')).toBeNull();
			expect(cache.get('key2')).toBeNull();
		});
	});

	describe('Cache Key Generation', () => {
		test('should generate cache keys correctly', () => {
			const key = cacheKey('user', 123, 'profile');
			expect(key).toBe('user:123:profile');
		});

		test('should handle different data types in keys', () => {
			const key = cacheKey('prefix', 42, 'suffix', true);
			expect(key).toBe('prefix:42:suffix:true');
		});

		test('should generate predefined cache keys', () => {
			expect(CacheKeys.userLinks('user123')).toBe('user:user123:links');
			expect(CacheKeys.linkStats('link456')).toBe('link:link456:stats');
			expect(CacheKeys.userProfile('john')).toBe('profile:john');
			expect(CacheKeys.linkRedirect('abc123')).toBe('redirect:abc123');
		});
	});

	describe('Cache Cleanup', () => {
		test('should cleanup expired entries', async () => {
			const shortTTL = 10; // 10ms
			
			cache.set('key1', 'value1', shortTTL);
			cache.set('key2', 'value2', 60000); // 1 minute

			// Wait for first key to expire
			await new Promise(resolve => setTimeout(resolve, 20));

			cache.cleanup();

			expect(cache.get('key1')).toBeNull();
			expect(cache.get('key2')).toBe('value2');
		});
	});

	describe('Type Safety', () => {
		test('should handle typed values correctly', () => {
			interface TestData {
				id: string;
				name: string;
				count: number;
			}

			const key = 'typed-test';
			const value: TestData = { id: '123', name: 'test', count: 42 };

			cache.set<TestData>(key, value);
			const result = cache.get<TestData>(key);

			expect(result).toEqual(value);
			expect(result?.id).toBe('123');
			expect(result?.count).toBe(42);
		});

		test('should handle arrays and objects', () => {
			const arrayKey = 'array-test';
			const arrayValue = [1, 2, 3, 'test'];

			const objectKey = 'object-test';
			const objectValue = { 
				nested: { deep: true }, 
				array: [1, 2, 3],
				date: new Date().toISOString()
			};

			cache.set(arrayKey, arrayValue);
			cache.set(objectKey, objectValue);

			expect(cache.get(arrayKey)).toEqual(arrayValue);
			expect(cache.get(objectKey)).toEqual(objectValue);
		});
	});

	describe('Edge Cases', () => {
		test('should handle undefined and null values', () => {
			cache.set('null-test', null);
			cache.set('undefined-test', undefined);

			expect(cache.get('null-test')).toBeNull();
			expect(cache.get('undefined-test')).toBeUndefined();
		});

		test('should handle empty strings and zero values', () => {
			cache.set('empty-string', '');
			cache.set('zero', 0);
			cache.set('false', false);

			expect(cache.get('empty-string')).toBe('');
			expect(cache.get('zero')).toBe(0);
			expect(cache.get('false')).toBe(false);
		});

		test('should handle concurrent access', () => {
			const key = 'concurrent-test';
			
			// Simulate concurrent writes
			cache.set(key, 'value1');
			cache.set(key, 'value2');
			cache.set(key, 'value3');

			// Last write should win
			expect(cache.get(key)).toBe('value3');
		});

		test('should handle very long keys', () => {
			const longKey = 'a'.repeat(1000);
			const value = 'test-value';

			cache.set(longKey, value);
			expect(cache.get(longKey)).toBe(value);
		});
	});

	describe('Performance', () => {
		test('should handle large number of entries efficiently', () => {
			const startTime = Date.now();
			const entryCount = 1000;

			// Set many entries
			for (let i = 0; i < entryCount; i++) {
				cache.set(`key-${i}`, `value-${i}`);
			}

			// Get many entries
			for (let i = 0; i < entryCount; i++) {
				expect(cache.get(`key-${i}`)).toBe(`value-${i}`);
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Should complete within reasonable time (1 second for 1000 entries)
			expect(duration).toBeLessThan(1000);
		});

		test('should handle large values efficiently', () => {
			const largeValue = {
				data: 'x'.repeat(10000),
				array: Array(1000).fill('test'),
				nested: {
					deep: {
						very: {
							deep: 'value'
						}
					}
				}
			};

			const key = 'large-value-test';
			cache.set(key, largeValue);
			
			const result = cache.get(key);
			expect(result).toEqual(largeValue);
		});
	});
});