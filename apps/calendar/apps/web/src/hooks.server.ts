/**
 * Server Hooks for SvelteKit
 * - Injects runtime environment variables for client-side use
 * - Adds security headers
 * - Auth is handled client-side via Mana Core Auth
 */

import type { Handle } from '@sveltejs/kit';
import { injectUmamiAnalytics } from '@manacore/shared-utils/analytics-server';
import { setSecurityHeaders } from '@manacore/shared-utils/security-headers';

// Get client-side URLs from environment (Docker runtime)
// In dev mode, Vite exposes .env vars via import.meta.env, not process.env
const PUBLIC_MANA_CORE_AUTH_URL_CLIENT =
	process.env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT ||
	process.env.PUBLIC_MANA_CORE_AUTH_URL ||
	'http://localhost:3001';
const PUBLIC_BACKEND_URL_CLIENT =
	process.env.PUBLIC_BACKEND_URL_CLIENT ||
	process.env.PUBLIC_BACKEND_URL ||
	'http://localhost:3014';
const PUBLIC_STT_URL = process.env.PUBLIC_STT_URL || 'https://stt-api.mana.how';

// Cross-app integration URLs (for contacts API)
const PUBLIC_CONTACTS_API_URL = process.env.PUBLIC_CONTACTS_API_URL || 'http://localhost:3015';
const PUBLIC_GLITCHTIP_DSN = process.env.PUBLIC_GLITCHTIP_DSN || '';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			// Inject runtime environment variables into the HTML
			// These will be available on window.__PUBLIC_*__ for client-side code
			const envScript = `<script>
window.__PUBLIC_MANA_CORE_AUTH_URL__ = ${JSON.stringify(PUBLIC_MANA_CORE_AUTH_URL_CLIENT)};
window.__PUBLIC_BACKEND_URL__ = ${JSON.stringify(PUBLIC_BACKEND_URL_CLIENT)};
window.__PUBLIC_STT_URL__ = ${JSON.stringify(PUBLIC_STT_URL)};
window.__PUBLIC_CONTACTS_API_URL__ = ${JSON.stringify(PUBLIC_CONTACTS_API_URL)};
window.__PUBLIC_GLITCHTIP_DSN__ = ${JSON.stringify(PUBLIC_GLITCHTIP_DSN)};
</script>`;
			return injectUmamiAnalytics(html.replace('<head>', `<head>${envScript}`));
		},
	});

	setSecurityHeaders(response, {
		connectSrc: [
			PUBLIC_MANA_CORE_AUTH_URL_CLIENT,
			PUBLIC_BACKEND_URL_CLIENT,
			PUBLIC_STT_URL,
			PUBLIC_CONTACTS_API_URL,
		],
	});

	return response;
};
