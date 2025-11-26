// Simple in-memory cache with TTL for server-side caching
// In Produktion kann das durch Redis/Valkey ersetzt werden

interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

class SimpleCache {
	private cache = new Map<string, CacheEntry<any>>();
	private readonly defaultTTL = 5 * 60 * 1000; // 5 Minuten default

	set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
		const expiresAt = Date.now() + ttlMs;
		this.cache.set(key, { data, expiresAt });
	}

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	// Periodisches Cleanup abgelaufener Einträge
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiresAt) {
				this.cache.delete(key);
			}
		}
	}
}

// Globale Cache-Instanz
export const cache = new SimpleCache();

// Cleanup alle 10 Minuten
if (typeof setInterval !== 'undefined') {
	setInterval(() => cache.cleanup(), 10 * 60 * 1000);
}

// Helper Funktionen für häufige Cache-Pattern
export function cacheKey(...parts: (string | number)[]): string {
	return parts.join(':');
}

// Cache-Decorator für async Funktionen
export function cached<T>(
	keyGenerator: (...args: any[]) => string,
	ttlMs: number = 5 * 60 * 1000
) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: any[]): Promise<T> {
			const key = keyGenerator(...args);
			const cached = cache.get<T>(key);

			if (cached !== null) {
				return cached;
			}

			const result = await originalMethod.apply(this, args);
			cache.set(key, result, ttlMs);
			return result;
		};

		return descriptor;
	};
}

// Spezielle Cache-Keys für uLoad
export const CacheKeys = {
	userLinks: (userId: string) => cacheKey('user', userId, 'links'),
	linkStats: (linkId: string) => cacheKey('link', linkId, 'stats'),
	userProfile: (username: string) => cacheKey('profile', username),
	linkRedirect: (shortCode: string) => cacheKey('redirect', shortCode),
	analyticsDaily: (linkId: string, date: string) => cacheKey('analytics', linkId, date),
	userCards: (userId: string) => cacheKey('user', userId, 'cards'),
	publicCard: (username: string, cardId: string) => cacheKey('public', username, cardId)
} as const;