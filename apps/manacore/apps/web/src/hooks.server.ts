import type { Handle } from '@sveltejs/kit';
import { injectUmamiAnalytics } from '@manacore/shared-utils/analytics-server';
import { setSecurityHeaders } from '@manacore/shared-utils/security-headers';

/**
 * Server hooks for ManaCore web app
 *
 * Injects runtime environment variables into the HTML for client-side access.
 * This is necessary because SvelteKit's $env/static/public bakes values at build time,
 * but Docker containers need runtime configuration.
 */

// Auth URL
const PUBLIC_MANA_CORE_AUTH_URL_CLIENT =
	process.env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT || process.env.PUBLIC_MANA_CORE_AUTH_URL || '';

// Backend URLs for dashboard widgets
const PUBLIC_TODO_API_URL_CLIENT =
	process.env.PUBLIC_TODO_API_URL_CLIENT || process.env.PUBLIC_TODO_API_URL || '';
const PUBLIC_CALENDAR_API_URL_CLIENT =
	process.env.PUBLIC_CALENDAR_API_URL_CLIENT || process.env.PUBLIC_CALENDAR_API_URL || '';
const PUBLIC_CLOCK_API_URL_CLIENT =
	process.env.PUBLIC_CLOCK_API_URL_CLIENT || process.env.PUBLIC_CLOCK_API_URL || '';
const PUBLIC_CONTACTS_API_URL_CLIENT =
	process.env.PUBLIC_CONTACTS_API_URL_CLIENT || process.env.PUBLIC_CONTACTS_API_URL || '';
const PUBLIC_GLITCHTIP_DSN = process.env.PUBLIC_GLITCHTIP_DSN || '';

// Map of app subdomains to internal paths
const APP_SUBDOMAINS = new Set([
	'todo',
	'chat',
	'calendar',
	'contacts',
	'zitare',
	'skilltree',
	'planta',
	'cards',
	'storage',
	'presi',
	'nutriphi',
	'photos',
	'mukke',
	'picture',
	'calc',
	'citycorners',
	'inventar',
	'times',
	'uload',
	'memoro',
	'context',
	'questions',
	'moodlit',
]);

export const handle: Handle = async ({ event, resolve }) => {
	// Redirect app subdomains to their path equivalent
	// e.g. todo.mana.how → mana.how/todo
	const host = event.request.headers.get('host') || '';
	const subdomain = host.split('.')[0];
	if (APP_SUBDOMAINS.has(subdomain) && event.url.pathname === '/') {
		return new Response(null, {
			status: 302,
			headers: { Location: `/${subdomain}` },
		});
	}

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			const envScript = `<script>
window.__PUBLIC_MANA_CORE_AUTH_URL__ = ${JSON.stringify(PUBLIC_MANA_CORE_AUTH_URL_CLIENT)};
window.__PUBLIC_TODO_API_URL__ = ${JSON.stringify(PUBLIC_TODO_API_URL_CLIENT)};
window.__PUBLIC_CALENDAR_API_URL__ = ${JSON.stringify(PUBLIC_CALENDAR_API_URL_CLIENT)};
window.__PUBLIC_CLOCK_API_URL__ = ${JSON.stringify(PUBLIC_CLOCK_API_URL_CLIENT)};
window.__PUBLIC_CONTACTS_API_URL__ = ${JSON.stringify(PUBLIC_CONTACTS_API_URL_CLIENT)};
window.__PUBLIC_GLITCHTIP_DSN__ = ${JSON.stringify(PUBLIC_GLITCHTIP_DSN)};
</script>`;
			return injectUmamiAnalytics(html.replace('<head>', `<head>${envScript}`));
		},
	});

	setSecurityHeaders(response, {
		connectSrc: [
			PUBLIC_MANA_CORE_AUTH_URL_CLIENT,
			PUBLIC_TODO_API_URL_CLIENT,
			PUBLIC_CALENDAR_API_URL_CLIENT,
			PUBLIC_CLOCK_API_URL_CLIENT,
			PUBLIC_CONTACTS_API_URL_CLIENT,
		],
	});

	return response;
};
