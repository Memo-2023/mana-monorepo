/**
 * Server Hooks for SvelteKit
 * - Injects runtime environment variables for client-side use
 * - Auth is handled client-side via Mana Core Auth
 */

import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
	// Get client-side URLs from environment at RUNTIME (not build time)
	// Use $env/dynamic/private to read actual runtime environment variables
	const authUrlClient = env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT || env.PUBLIC_MANA_CORE_AUTH_URL || '';
	const backendUrlClient = env.PUBLIC_BACKEND_URL_CLIENT || env.PUBLIC_BACKEND_URL || '';

	return resolve(event, {
		transformPageChunk: ({ html }) => {
			// Inject runtime environment variables into the HTML
			// These will be available on window.__PUBLIC_*__ for client-side code
			const envScript = `<script>
window.__PUBLIC_MANA_CORE_AUTH_URL__ = "${authUrlClient}";
window.__PUBLIC_BACKEND_URL__ = "${backendUrlClient}";
</script>`;
			return html.replace('<head>', `<head>${envScript}`);
		},
	});
};
