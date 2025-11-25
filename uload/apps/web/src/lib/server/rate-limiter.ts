// Rate Limiter für uLoad API Endpoints
import type { RequestEvent } from '@sveltejs/kit';

interface RateLimitConfig {
	windowMs: number; // Zeitfenster in Millisekunden
	maxRequests: number; // Max. Anzahl Requests pro Zeitfenster
	message?: string; // Custom Error Message
	keyGenerator?: (event: RequestEvent) => string; // Custom Key Generator
	skipIf?: (event: RequestEvent) => boolean; // Skip Rate Limiting
	onLimitReached?: (event: RequestEvent, key: string) => void; // Callback
}

interface RateLimitEntry {
	count: number;
	resetTime: number;
	firstRequest: number;
}

// In-Memory Store (in Produktion Redis verwenden)
const store = new Map<string, RateLimitEntry>();

// Cleanup alte Einträge alle 5 Minuten
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of store.entries()) {
		if (now > entry.resetTime) {
			store.delete(key);
		}
	}
}, 5 * 60 * 1000);

// Standard Key Generator
function defaultKeyGenerator(event: RequestEvent): string {
	const ip = getClientIP(event);
	const userAgent = event.request.headers.get('user-agent') || 'unknown';
	const route = event.route.id || event.url.pathname;
	
	// Kombiniere IP, User-Agent Hash und Route für eindeutigen Key
	const uaHash = hashString(userAgent);
	return `${ip}:${uaHash}:${route}`;
}

// Client IP ermitteln (mit Proxy-Support)
function getClientIP(event: RequestEvent): string {
	// Prüfe verschiedene Headers für echte Client-IP
	const headers = event.request.headers;
	
	// Cloudflare
	const cfConnectingIP = headers.get('cf-connecting-ip');
	if (cfConnectingIP) return cfConnectingIP;
	
	// Standard Proxy Headers
	const xForwardedFor = headers.get('x-forwarded-for');
	if (xForwardedFor) {
		// Erste IP aus der Liste nehmen
		return xForwardedFor.split(',')[0].trim();
	}
	
	const xRealIP = headers.get('x-real-ip');
	if (xRealIP) return xRealIP;
	
	// Fallback auf connection info
	return event.getClientAddress();
}

// Einfacher String Hash
function hashString(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // 32-bit integer
	}
	return Math.abs(hash).toString(36);
}

// Rate Limiter Middleware
export function rateLimit(config: RateLimitConfig) {
	const {
		windowMs,
		maxRequests,
		message = 'Too many requests',
		keyGenerator = defaultKeyGenerator,
		skipIf,
		onLimitReached
	} = config;

	return async (event: RequestEvent): Promise<Response | null> => {
		// Skip wenn Bedingung erfüllt
		if (skipIf && skipIf(event)) {
			return null;
		}

		const now = Date.now();
		const key = keyGenerator(event);
		const entry = store.get(key);

		if (!entry) {
			// Erster Request für diesen Key
			store.set(key, {
				count: 1,
				resetTime: now + windowMs,
				firstRequest: now
			});
			return null;
		}

		// Prüfe ob Zeitfenster abgelaufen ist
		if (now > entry.resetTime) {
			// Reset Counter
			store.set(key, {
				count: 1,
				resetTime: now + windowMs,
				firstRequest: now
			});
			return null;
		}

		// Increment Counter
		entry.count++;
		store.set(key, entry);

		// Prüfe Limit
		if (entry.count > maxRequests) {
			onLimitReached?.(event, key);
			
			const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
			
			return new Response(
				JSON.stringify({
					error: message,
					retryAfter,
					limit: maxRequests,
					window: Math.ceil(windowMs / 1000)
				}),
				{
					status: 429,
					headers: {
						'Content-Type': 'application/json',
						'Retry-After': retryAfter.toString(),
						'X-RateLimit-Limit': maxRequests.toString(),
						'X-RateLimit-Remaining': '0',
						'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString(),
						'X-RateLimit-Window': Math.ceil(windowMs / 1000).toString()
					}
				}
			);
		}

		// Request ist OK, füge Rate Limit Headers hinzu
		const remaining = Math.max(0, maxRequests - entry.count);
		const reset = Math.ceil(entry.resetTime / 1000);
		
		// Headers werden später in der Response gesetzt
		event.locals.rateLimitHeaders = {
			'X-RateLimit-Limit': maxRequests.toString(),
			'X-RateLimit-Remaining': remaining.toString(),
			'X-RateLimit-Reset': reset.toString(),
			'X-RateLimit-Window': Math.ceil(windowMs / 1000).toString()
		};

		return null; // Request durchlassen
	};
}

// Vordefinierte Rate Limit Konfigurationen
export const RateLimits = {
	// API Endpoints
	api: rateLimit({
		windowMs: 15 * 60 * 1000, // 15 Minuten
		maxRequests: 100,
		message: 'Too many API requests'
	}),

	// Authentication
	auth: rateLimit({
		windowMs: 15 * 60 * 1000, // 15 Minuten
		maxRequests: 5, // Nur 5 Login-Versuche
		message: 'Too many authentication attempts',
		keyGenerator: (event) => {
			// Nur IP für Auth, nicht User-Agent
			return `auth:${getClientIP(event)}`;
		}
	}),

	// Link Creation
	linkCreation: rateLimit({
		windowMs: 60 * 1000, // 1 Minute
		maxRequests: 20, // 20 Links pro Minute
		message: 'Too many links created',
		keyGenerator: (event) => {
			// User-spezifisch wenn eingeloggt
			const userId = event.locals.user?.id;
			if (userId) {
				return `links:user:${userId}`;
			}
			// Sonst IP-basiert
			return `links:ip:${getClientIP(event)}`;
		}
	}),

	// Password Reset
	passwordReset: rateLimit({
		windowMs: 60 * 60 * 1000, // 1 Stunde
		maxRequests: 3, // Nur 3 Password Resets pro Stunde
		message: 'Too many password reset attempts',
		keyGenerator: (event) => {
			return `reset:${getClientIP(event)}`;
		}
	}),

	// Registration
	registration: rateLimit({
		windowMs: 60 * 60 * 1000, // 1 Stunde
		maxRequests: 5, // 5 Registrierungen pro Stunde pro IP
		message: 'Too many registration attempts',
		keyGenerator: (event) => {
			return `register:${getClientIP(event)}`;
		}
	}),

	// Link Clicks (sehr großzügig, nur gegen DDoS)
	clicks: rateLimit({
		windowMs: 60 * 1000, // 1 Minute
		maxRequests: 300, // 300 Clicks pro Minute
		message: 'Too many requests',
		keyGenerator: (event) => {
			return `clicks:${getClientIP(event)}`;
		}
	}),

	// Strikte Limits für kritische Operationen
	strict: rateLimit({
		windowMs: 60 * 60 * 1000, // 1 Stunde
		maxRequests: 1, // Nur 1 Request pro Stunde
		message: 'Operation rate limited'
	})
};

// Helper für Custom Rate Limits
export function createUserRateLimit(userId: string, config: Partial<RateLimitConfig>) {
	return rateLimit({
		windowMs: 15 * 60 * 1000,
		maxRequests: 100,
		...config,
		keyGenerator: () => `user:${userId}:${config.keyGenerator ? 'custom' : 'default'}`
	});
}

// IP Whitelist Support
const whitelist = new Set([
	'127.0.0.1',
	'::1',
	// Weitere IPs können hier hinzugefügt werden
]);

export function createWhitelistSkip(additionalIPs: string[] = []) {
	const fullWhitelist = new Set([...whitelist, ...additionalIPs]);
	
	return (event: RequestEvent): boolean => {
		const ip = getClientIP(event);
		return fullWhitelist.has(ip);
	};
}

// Sliding Window Rate Limiter (genauer aber ressourcenintensiver)
export function slidingWindowRateLimit(config: RateLimitConfig & { precision?: number }) {
	const { precision = 10 } = config; // Anzahl Sub-Windows
	
	return async (event: RequestEvent): Promise<Response | null> => {
		const now = Date.now();
		const key = (config.keyGenerator || defaultKeyGenerator)(event);
		const windowSize = config.windowMs / precision;
		const currentWindow = Math.floor(now / windowSize);
		
		// Lösche alte Windows
		for (const [storeKey] of store.entries()) {
			if (storeKey.startsWith(key + ':')) {
				const windowNum = parseInt(storeKey.split(':').pop() || '0');
				if (currentWindow - windowNum > precision) {
					store.delete(storeKey);
				}
			}
		}
		
		// Zähle Requests in allen aktiven Windows
		let totalRequests = 0;
		for (let i = 0; i < precision; i++) {
			const windowKey = `${key}:${currentWindow - i}`;
			const windowEntry = store.get(windowKey);
			if (windowEntry) {
				totalRequests += windowEntry.count;
			}
		}
		
		// Increment current window
		const currentWindowKey = `${key}:${currentWindow}`;
		const currentEntry = store.get(currentWindowKey) || { count: 0, resetTime: now + windowSize, firstRequest: now };
		currentEntry.count++;
		store.set(currentWindowKey, currentEntry);
		totalRequests++;
		
		// Check limit
		if (totalRequests > config.maxRequests) {
			const oldestWindow = currentWindow - precision + 1;
			const oldestEntry = store.get(`${key}:${oldestWindow}`);
			const retryAfter = oldestEntry ? Math.ceil((oldestEntry.resetTime - now) / 1000) : Math.ceil(windowSize / 1000);
			
			return new Response(
				JSON.stringify({
					error: config.message || 'Too many requests',
					retryAfter,
					limit: config.maxRequests,
					current: totalRequests
				}),
				{
					status: 429,
					headers: {
						'Content-Type': 'application/json',
						'Retry-After': retryAfter.toString()
					}
				}
			);
		}
		
		return null;
	};
}

// Rate Limit Status abrufen
export function getRateLimitStatus(key: string): {
	requests: number;
	limit: number;
	remaining: number;
	resetTime: number;
} | null {
	const entry = store.get(key);
	if (!entry) {
		return null;
	}
	
	return {
		requests: entry.count,
		limit: 0, // Müsste aus der ursprünglichen Config kommen
		remaining: 0, // Berechnet
		resetTime: entry.resetTime
	};
}