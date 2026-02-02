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
const PUBLIC_STT_URL = process.env.PUBLIC_STT_URL || 'https://stt-api.mana.how';

// Cross-app integration URLs (for todo and contacts APIs)
const PUBLIC_TODO_BACKEND_URL = process.env.PUBLIC_TODO_BACKEND_URL || 'http://localhost:3018';
const PUBLIC_CONTACTS_API_URL = process.env.PUBLIC_CONTACTS_API_URL || 'http://localhost:3015';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		transformPageChunk: ({ html }) => {
			// Inject runtime environment variables into the HTML
			// These will be available on window.__PUBLIC_*__ for client-side code
			const envScript = `<script>
window.__PUBLIC_MANA_CORE_AUTH_URL__ = "${PUBLIC_MANA_CORE_AUTH_URL_CLIENT}";
window.__PUBLIC_BACKEND_URL__ = "${PUBLIC_BACKEND_URL_CLIENT}";
window.__PUBLIC_STT_URL__ = "${PUBLIC_STT_URL}";
window.__PUBLIC_TODO_BACKEND_URL__ = "${PUBLIC_TODO_BACKEND_URL}";
window.__PUBLIC_CONTACTS_API_URL__ = "${PUBLIC_CONTACTS_API_URL}";
</script>`;
			return html.replace('<head>', `<head>${envScript}`);
		},
	});
};
