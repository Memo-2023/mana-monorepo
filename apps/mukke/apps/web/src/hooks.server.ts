/**
 * Server Hooks for SvelteKit
 * - Injects runtime environment variables for client-side use
 * - Auth is handled client-side via Mana Core Auth
 */

import type { Handle } from '@sveltejs/kit';
import { injectUmamiAnalytics } from '@manacore/shared-utils/analytics-server';
import { setSecurityHeaders } from '@manacore/shared-utils/security-headers';

// Get client-side URLs from environment (Docker runtime)
const PUBLIC_MANA_CORE_AUTH_URL_CLIENT =
	process.env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT || process.env.PUBLIC_MANA_CORE_AUTH_URL || '';
const PUBLIC_BACKEND_URL_CLIENT =
	process.env.PUBLIC_BACKEND_URL_CLIENT || process.env.PUBLIC_BACKEND_URL || '';
const PUBLIC_GLITCHTIP_DSN = process.env.PUBLIC_GLITCHTIP_DSN || '';
const S3_PUBLIC_ENDPOINT = process.env.S3_PUBLIC_ENDPOINT || 'https://minio.mana.how';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			// Inject runtime environment variables into the HTML
			// These will be available on window.__PUBLIC_*__ for client-side code
			const envScript = `<script>
window.__PUBLIC_MANA_CORE_AUTH_URL__ = ${JSON.stringify(PUBLIC_MANA_CORE_AUTH_URL_CLIENT)};
window.__PUBLIC_BACKEND_URL__ = ${JSON.stringify(PUBLIC_BACKEND_URL_CLIENT)};
window.__PUBLIC_GLITCHTIP_DSN__ = ${JSON.stringify(PUBLIC_GLITCHTIP_DSN)};
</script>`;
			return injectUmamiAnalytics(html.replace('<head>', `<head>${envScript}`));
		},
	});

	setSecurityHeaders(response, {
		connectSrc: [PUBLIC_MANA_CORE_AUTH_URL_CLIENT, PUBLIC_BACKEND_URL_CLIENT, S3_PUBLIC_ENDPOINT],
		mediaSrc: [S3_PUBLIC_ENDPOINT, 'blob:'],
		imgSrc: [S3_PUBLIC_ENDPOINT],
		// Butterchurn (Milkdrop) uses eval() for shader/preset compilation
		scriptSrc: ["'unsafe-eval'"],
	});

	return response;
};
