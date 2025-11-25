// Server-side caching middleware für SvelteKit
import { cache, CacheKeys, cacheKey } from '$lib/cache';
import type { Handle } from '@sveltejs/kit';

// Response caching für statische Inhalte
export function withResponseCache(ttlMs: number = 5 * 60 * 1000): Handle {
	return async ({ event, resolve }) => {
		const { url, request } = event;
		
		// Nur GET Requests cachen
		if (request.method !== 'GET') {
			return resolve(event);
		}

		// Cache-Key basierend auf URL und Query Parameters
		const cacheKeyStr = cacheKey('response', url.pathname, url.search);
		const cached = cache.get<string>(cacheKeyStr);

		if (cached) {
			return new Response(cached, {
				headers: {
					'Content-Type': 'text/html',
					'Cache-Control': `public, max-age=${Math.floor(ttlMs / 1000)}`,
					'X-Cache': 'HIT'
				}
			});
		}

		const response = await resolve(event);
		
		// Nur erfolgreiche HTML-Responses cachen
		if (response.status === 200 && response.headers.get('content-type')?.includes('text/html')) {
			const html = await response.text();
			cache.set(cacheKeyStr, html, ttlMs);
			
			return new Response(html, {
				...response,
				headers: {
					...response.headers,
					'Cache-Control': `public, max-age=${Math.floor(ttlMs / 1000)}`,
					'X-Cache': 'MISS'
				}
			});
		}

		return response;
	};
}

// API Response caching
export function cacheApiResponse<T>(key: string, data: T, ttlMs: number = 60 * 1000): void {
	cache.set(key, data, ttlMs);
}

export function getCachedApiResponse<T>(key: string): T | null {
	return cache.get<T>(key);
}

// Link redirect caching (sehr wichtig für Performance)
export function cacheRedirect(shortCode: string, url: string, ttlMs: number = 10 * 60 * 1000): void {
	cache.set(CacheKeys.linkRedirect(shortCode), url, ttlMs);
}

export function getCachedRedirect(shortCode: string): string | null {
	return cache.get<string>(CacheKeys.linkRedirect(shortCode));
}

// User data caching
export function cacheUserData(userId: string, data: any, ttlMs: number = 5 * 60 * 1000): void {
	cache.set(CacheKeys.userLinks(userId), data, ttlMs);
}

export function getCachedUserData(userId: string): any | null {
	return cache.get(CacheKeys.userLinks(userId));
}

// Cache invalidation helpers
export function invalidateUserCache(userId: string): void {
	cache.delete(CacheKeys.userLinks(userId));
	cache.delete(CacheKeys.userCards(userId));
}

export function invalidateLinkCache(linkId: string, shortCode: string): void {
	cache.delete(CacheKeys.linkStats(linkId));
	cache.delete(CacheKeys.linkRedirect(shortCode));
}

// Browser cache headers helper
export function setBrowserCache(headers: Headers, maxAge: number = 300): void {
	headers.set('Cache-Control', `public, max-age=${maxAge}`);
	headers.set('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
}