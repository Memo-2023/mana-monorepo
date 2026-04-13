/**
 * API Configuration
 * Provides runtime-configurable URLs for API calls
 */

import { browser } from '$app/environment';

/**
 * Get the Mana Core Auth URL dynamically at runtime
 * - Client-side: uses injected window variable (set by hooks.server.ts)
 * - Server-side (SSR): uses environment variable
 * - Falls back to localhost for local development
 */
export function getManaAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		// Client-side: use injected window variable (set by hooks.server.ts)
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_AUTH_URL__?: string })
			.__PUBLIC_MANA_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	// Server-side (SSR): use environment variable
	return process.env.PUBLIC_MANA_AUTH_URL || 'http://localhost:3001';
}

/**
 * Get the mana-events service URL (Phase 1b: public RSVP backend).
 */
export function getManaEventsUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injected = (window as unknown as { __PUBLIC_MANA_EVENTS_URL__?: string })
			.__PUBLIC_MANA_EVENTS_URL__;
		return injected || 'http://localhost:3065';
	}
	return process.env.PUBLIC_MANA_EVENTS_URL || 'http://localhost:3065';
}

/**
 * Get the unified mana-api URL (Hono/Bun, port 3060 in dev).
 * Hosts module-specific compute endpoints under /api/v1/{module}/*.
 */
export function getManaApiUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injected = (window as unknown as { __PUBLIC_MANA_API_URL__?: string })
			.__PUBLIC_MANA_API_URL__;
		return injected || 'http://localhost:3060';
	}
	return process.env.PUBLIC_MANA_API_URL || 'http://localhost:3060';
}

/**
 * Get the mana-credits service URL.
 * Hosts credit balance, packages, transactions, gift codes, sync billing.
 */
export function getManaCreditsUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injected = (window as unknown as { __PUBLIC_MANA_CREDITS_URL__?: string })
			.__PUBLIC_MANA_CREDITS_URL__;
		return injected || 'http://localhost:3061';
	}
	return process.env.PUBLIC_MANA_CREDITS_URL || 'http://localhost:3061';
}

/**
 * Get the mana-mail service URL.
 * Hosts mail threads, send, labels, accounts.
 */
export function getManaMailUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injected = (window as unknown as { __PUBLIC_MANA_MAIL_URL__?: string })
			.__PUBLIC_MANA_MAIL_URL__;
		return injected || 'http://localhost:3042';
	}
	return process.env.PUBLIC_MANA_MAIL_URL || 'http://localhost:3042';
}
