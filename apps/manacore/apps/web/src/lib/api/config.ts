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
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	// Server-side (SSR): use environment variable
	return process.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';
}
