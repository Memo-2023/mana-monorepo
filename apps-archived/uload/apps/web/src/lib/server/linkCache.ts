import { redis, cache, ensureRedisConnection, redisAvailable } from './redis';
import type { Link } from '$lib/pocketbase';

/**
 * Link Redirect Cache - Massively speeds up redirects
 * Cache Strategy: Cache popular links for 24 hours
 */

const CACHE_TTL = 86400; // 24 hours in seconds
const SHORT_TTL = 300; // 5 minutes for less popular links

export class LinkCache {
	private prefix = 'link:';
	private redirectPrefix = 'redirect:';
	private clickCountPrefix = 'clicks:';

	/**
	 * Get redirect URL for a short code (SUPER FAST)
	 */
	async getRedirectUrl(shortCode: string): Promise<string | null> {
		try {
			// Ensure Redis is connected
			await ensureRedisConnection();

			const cacheKey = `${this.redirectPrefix}${shortCode}`;

			// Try to get from cache first
			const cachedUrl = redis ? await redis.get(cacheKey) : null;

			if (cachedUrl) {
				// Async increment hit counter (non-blocking)
				this.incrementHitCount(shortCode).catch(console.error);
				return cachedUrl;
			}

			return null;
		} catch (error) {
			console.error('LinkCache.getRedirectUrl error:', error);
			return null;
		}
	}

	/**
	 * Cache a link redirect
	 */
	async cacheRedirect(
		shortCode: string,
		targetUrl: string,
		popular: boolean = false
	): Promise<void> {
		try {
			await ensureRedisConnection();

			const cacheKey = `${this.redirectPrefix}${shortCode}`;
			const ttl = popular ? CACHE_TTL : SHORT_TTL;

			if (redis) {
				await redis.setex(cacheKey, ttl, targetUrl);
			}
		} catch (error) {
			console.error('LinkCache.cacheRedirect error:', error);
		}
	}

	/**
	 * Cache full link object
	 */
	async cacheLink(link: Link): Promise<void> {
		try {
			await ensureRedisConnection();

			// Cache the redirect URL
			await this.cacheRedirect(link.short_code, link.original_url);

			// Cache the full link object
			const linkKey = `${this.prefix}${link.short_code}`;
			await cache.set(linkKey, link, SHORT_TTL);
		} catch (error) {
			console.error('LinkCache.cacheLink error:', error);
		}
	}

	/**
	 * Get full link object from cache
	 */
	async getLink(shortCode: string): Promise<Link | null> {
		try {
			await ensureRedisConnection();

			const linkKey = `${this.prefix}${shortCode}`;
			return await cache.get<Link>(linkKey);
		} catch (error) {
			console.error('LinkCache.getLink error:', error);
			return null;
		}
	}

	/**
	 * Invalidate cache for a link
	 */
	async invalidate(shortCode: string): Promise<void> {
		try {
			await ensureRedisConnection();

			if (redis) {
				await redis.del(
					`${this.redirectPrefix}${shortCode}`,
					`${this.prefix}${shortCode}`,
					`${this.clickCountPrefix}${shortCode}`
				);
			}
		} catch (error) {
			console.error('LinkCache.invalidate error:', error);
		}
	}

	/**
	 * Cache user's links
	 */
	async cacheUserLinks(userId: string, links: Link[], page: number = 1): Promise<void> {
		try {
			await ensureRedisConnection();

			const cacheKey = `user:${userId}:links:page:${page}`;
			await cache.set(cacheKey, links, SHORT_TTL);

			// Also cache individual links
			for (const link of links) {
				await this.cacheLink(link);
			}
		} catch (error) {
			console.error('LinkCache.cacheUserLinks error:', error);
		}
	}

	/**
	 * Get user's cached links
	 */
	async getUserLinks(userId: string, page: number = 1): Promise<Link[] | null> {
		try {
			await ensureRedisConnection();

			const cacheKey = `user:${userId}:links:page:${page}`;
			return await cache.get<Link[]>(cacheKey);
		} catch (error) {
			console.error('LinkCache.getUserLinks error:', error);
			return null;
		}
	}

	/**
	 * Increment hit count for analytics
	 */
	private async incrementHitCount(shortCode: string): Promise<void> {
		try {
			const countKey = `${this.clickCountPrefix}${shortCode}`;
			await cache.incr(countKey);

			// Store in sorted set for trending links
			if (redis) {
				const score = Date.now();
				await redis.zadd('trending:links', score, shortCode);

				// Keep only last 7 days of trending data
				const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
				await redis.zremrangebyscore('trending:links', 0, weekAgo);
			}
		} catch (error) {
			// Don't throw - this is non-critical
			console.error('LinkCache.incrementHitCount error:', error);
		}
	}

	/**
	 * Get trending links
	 */
	async getTrendingLinks(limit: number = 10): Promise<string[]> {
		try {
			await ensureRedisConnection();

			// Get top links from sorted set
			if (redis) {
				const trending = await redis.zrevrange('trending:links', 0, limit - 1);
				return trending;
			}
			return [];
		} catch (error) {
			console.error('LinkCache.getTrendingLinks error:', error);
			return [];
		}
	}

	/**
	 * Warm up cache with popular links
	 */
	async warmCache(links: Link[]): Promise<void> {
		try {
			await ensureRedisConnection();

			if (redisAvailable) {
				console.log(`Warming cache with ${links.length} links`);

				for (const link of links) {
					await this.cacheRedirect(link.short_code, link.original_url, true);
				}
			} else {
				console.log('Cache warming skipped - Redis not available');
			}
		} catch (error) {
			console.error('LinkCache.warmCache error:', error);
		}
	}
}

// Export singleton instance
export const linkCache = new LinkCache();
