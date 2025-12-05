/**
 * Server Hooks for SvelteKit
 * - Injects runtime environment variables for client-side use
 * - Auth is handled client-side via Mana Core Auth
 */

import type { Handle } from '@sveltejs/kit';

// Get client-side URLs from environment (Docker runtime)
const PUBLIC_MANA_CORE_AUTH_URL_CLIENT =
	process.env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT || process.env.PUBLIC_MANA_CORE_AUTH_URL || '';
const PUBLIC_BACKEND_URL_CLIENT =
	process.env.PUBLIC_BACKEND_URL_CLIENT || process.env.PUBLIC_BACKEND_URL || '';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		transformPageChunk: ({ html }) => {
			// Inject runtime environment variables into the HTML
			// These will be available on window.__PUBLIC_*__ for client-side code
			const envScript = `<script>
window.__PUBLIC_MANA_CORE_AUTH_URL__ = "${PUBLIC_MANA_CORE_AUTH_URL_CLIENT}";
window.__PUBLIC_BACKEND_URL__ = "${PUBLIC_BACKEND_URL_CLIENT}";
</script>`;
			return html.replace('<head>', `<head>${envScript}`);
		},
	});
};
