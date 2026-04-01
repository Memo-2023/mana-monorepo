/**
 * Server-side hooks for SvelteKit
 * - Injects runtime environment variables for client-side use
 * - Custom CSRF protection that allows OAuth callbacks
 * - GlitchTip error tracking DSN injection
 */

import type { Handle } from '@sveltejs/kit';
import { injectUmamiAnalytics } from '@manacore/shared-utils/analytics-server';
import { setSecurityHeaders } from '@manacore/shared-utils/security-headers';

// Get client-side URLs from environment (Docker runtime)
const PUBLIC_MANA_CORE_AUTH_URL_CLIENT =
	process.env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT || process.env.PUBLIC_MANA_CORE_AUTH_URL || '';
const PUBLIC_MEMORO_SERVER_URL = process.env.PUBLIC_MEMORO_SERVER_URL || '';
const PUBLIC_GLITCHTIP_DSN = process.env.PUBLIC_GLITCHTIP_DSN || '';

// Routes that are allowed to receive cross-origin POST requests
// (OAuth callbacks from external providers)
const ALLOWED_PATHS = [
	'/auth/apple-callback-handler',
	'/auth/apple-callback',
	'/auth/google-callback',
];

export const handle: Handle = async ({ event, resolve }) => {
	const { request, url } = event;

	// CSRF protection: block cross-origin mutations except OAuth callbacks
	if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
		const origin = request.headers.get('origin');
		const forbidden =
			origin !== null &&
			origin !== url.origin &&
			!ALLOWED_PATHS.some((path) => url.pathname === path);

		if (forbidden) {
			console.warn('CSRF: Blocked cross-origin request:', {
				method: request.method,
				path: url.pathname,
				origin: origin,
				expectedOrigin: url.origin,
			});
			return new Response('Cross-site POST form submissions are forbidden', { status: 403 });
		}
	}

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			const envScript = `<script>
window.__PUBLIC_MANA_CORE_AUTH_URL__ = ${JSON.stringify(PUBLIC_MANA_CORE_AUTH_URL_CLIENT)};
window.__PUBLIC_MEMORO_SERVER_URL__ = ${JSON.stringify(PUBLIC_MEMORO_SERVER_URL)};
window.__PUBLIC_GLITCHTIP_DSN__ = ${JSON.stringify(PUBLIC_GLITCHTIP_DSN)};
</script>`;
			return injectUmamiAnalytics(html.replace('<head>', `<head>${envScript}`));
		},
	});

	setSecurityHeaders(response, {
		connectSrc: [
			PUBLIC_MANA_CORE_AUTH_URL_CLIENT || 'http://localhost:3001',
			PUBLIC_MEMORO_SERVER_URL || 'http://localhost:3015',
			PUBLIC_GLITCHTIP_DSN ? new URL(PUBLIC_GLITCHTIP_DSN).origin : '',
			'http://localhost:3050', // mana-sync server
		].filter(Boolean),
	});

	return response;
};
