import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { RateLimits } from '$lib/server/rate-limiter';
import { db } from '$lib/db';

export const handle: Handle = async ({ event, resolve }) => {
	// Rate Limiting anwenden (nur in Produktion)
	if (!dev) {
		const rateLimitResponse = await applyRateLimit(event);
		if (rateLimitResponse) {
			return rateLimitResponse;
		}
	}

	// Make database available in event.locals
	event.locals.db = db;

	// TODO: Implement external authentication
	// For now, user is always null until auth is implemented
	event.locals.user = null;

	console.log('\n[HOOKS] === Request:', event.url.pathname);
	console.log('[HOOKS] User:', event.locals.user?.id || 'Not authenticated');

	const response = await resolve(event);

	// Rate Limit Headers hinzufügen
	if (event.locals.rateLimitHeaders) {
		Object.entries(event.locals.rateLimitHeaders).forEach(([key, value]) => {
			response.headers.set(key, value);
		});
	}

	// Security Headers (nur in Produktion)
	if (!dev) {
		addSecurityHeaders(response);
	}

	return response;
};

// Rate Limiting basierend auf Route anwenden
async function applyRateLimit(event: any): Promise<Response | null> {
	const { pathname } = event.url;
	const method = event.request.method;

	// API Endpoints
	if (pathname.startsWith('/api/')) {
		// Spezifische Limits für verschiedene Endpoints
		if (
			pathname.includes('/auth') ||
			pathname.includes('/login') ||
			pathname.includes('/register')
		) {
			return await RateLimits.auth(event);
		}

		if (pathname.includes('/password-reset')) {
			return await RateLimits.passwordReset(event);
		}

		if (pathname.includes('/register')) {
			return await RateLimits.registration(event);
		}

		// Link-Operationen (POST für Creation)
		if (pathname.includes('/links') && method === 'POST') {
			return await RateLimits.linkCreation(event);
		}

		// General API Rate Limit
		return await RateLimits.api(event);
	}

	// Link Clicks (Redirects)
	if (
		pathname.length > 1 &&
		!pathname.startsWith('/api/') &&
		!pathname.startsWith('/my/') &&
		!pathname.startsWith('/admin/')
	) {
		// Könnte ein Short Link sein
		return await RateLimits.clicks(event);
	}

	// Auth Pages
	if (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password') {
		if (method === 'POST') {
			return await RateLimits.auth(event);
		}
	}

	// Kein Rate Limiting für andere Routen
	return null;
}

// Security Headers hinzufügen
function addSecurityHeaders(response: Response) {
	const headers = response.headers;

	// Content Security Policy (angepasst für uLoad)
	if (!headers.has('content-security-policy')) {
		const csp = [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://umami.ulo.ad https://analytics.google.com https://www.googletagmanager.com",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"font-src 'self' https://fonts.gstatic.com",
			"img-src 'self' data: https: blob:",
			"media-src 'self' blob:",
			"connect-src 'self' https://api.stripe.com https://js.stripe.com https://files.ulo.ad",
			"frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
			"object-src 'none'",
			"base-uri 'self'",
			"form-action 'self'",
			"frame-ancestors 'none'",
			dev ? '' : 'upgrade-insecure-requests' // Only in production
		]
			.filter(Boolean)
			.join('; ');

		headers.set('content-security-policy', csp);
	}

	// HSTS (HTTP Strict Transport Security)
	if (!headers.has('strict-transport-security')) {
		headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
	}

	// X-Frame-Options
	if (!headers.has('x-frame-options')) {
		headers.set('x-frame-options', 'DENY');
	}

	// X-Content-Type-Options
	if (!headers.has('x-content-type-options')) {
		headers.set('x-content-type-options', 'nosniff');
	}

	// Referrer Policy
	if (!headers.has('referrer-policy')) {
		headers.set('referrer-policy', 'strict-origin-when-cross-origin');
	}

	// Permissions Policy
	if (!headers.has('permissions-policy')) {
		headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
	}

	// X-XSS-Protection (für ältere Browser)
	if (!headers.has('x-xss-protection')) {
		headers.set('x-xss-protection', '1; mode=block');
	}
}
