import type { Handle } from '@sveltejs/kit';

/**
 * Server hooks for ManaCore web app
 *
 * Injects runtime environment variables into the HTML for client-side access.
 * This is necessary because SvelteKit's $env/static/public bakes values at build time,
 * but Docker containers need runtime configuration.
 */

const PUBLIC_MANA_CORE_AUTH_URL_CLIENT =
	process.env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT || process.env.PUBLIC_MANA_CORE_AUTH_URL || '';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		transformPageChunk: ({ html }) => {
			const envScript = `<script>
window.__PUBLIC_MANA_CORE_AUTH_URL__ = "${PUBLIC_MANA_CORE_AUTH_URL_CLIENT}";
</script>`;
			return html.replace('<head>', `<head>${envScript}`);
		},
	});
};
