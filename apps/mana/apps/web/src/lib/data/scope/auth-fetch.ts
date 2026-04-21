/**
 * Thin wrapper around fetch that prepends the mana-auth base URL and
 * always includes credentials. The web app does NOT proxy /api/auth
 * through SvelteKit — every Better Auth request goes directly to
 * mana-auth at http://localhost:3001 (dev) or https://auth.mana.how
 * (prod). Using a relative `/api/auth/...` path 404s against the
 * SvelteKit dev server.
 *
 * Resolution order (same as packages/shared-auth/authService):
 *   1. window.__PUBLIC_MANA_AUTH_URL__ — set by the page loader
 *   2. process.env.PUBLIC_MANA_AUTH_URL — build-time env
 *   3. http://localhost:3001 — dev fallback
 */

import { browser } from '$app/environment';

export function authBaseUrl(): string {
	// Browser: read the runtime-injected URL, fall back to localhost dev.
	// `process` is not defined in browsers, so the env-var branch below
	// MUST stay inside the server-side path to avoid a ReferenceError.
	if (browser && typeof window !== 'undefined') {
		const injected = (window as unknown as { __PUBLIC_MANA_AUTH_URL__?: string })
			.__PUBLIC_MANA_AUTH_URL__;
		return (injected || 'http://localhost:3001').replace(/\/$/, '');
	}
	// SSR: Node has `process.env`.
	const fromEnv =
		(typeof process !== 'undefined' && process.env?.PUBLIC_MANA_AUTH_URL) ||
		'http://localhost:3001';
	return fromEnv.replace(/\/$/, '');
}

/**
 * Fetch against the mana-auth server. Always sends cookies (credentials
 * include) so Better Auth can resolve the session. Path must start with
 * a slash — e.g. `/api/auth/organization/list`.
 */
export function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
	const url = `${authBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
	return fetch(url, {
		credentials: 'include',
		...init,
		headers: {
			...(init.body ? { 'content-type': 'application/json' } : {}),
			...(init.headers ?? {}),
		},
	});
}
