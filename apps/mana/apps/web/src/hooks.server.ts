import type { Handle } from '@sveltejs/kit';
import { injectUmamiAnalytics } from '@mana/shared-utils/analytics-server';
import { setSecurityHeaders } from '@mana/shared-utils/security-headers';

/**
 * Server hooks for Mana web app
 *
 * Injects runtime environment variables into the HTML for client-side access.
 * This is necessary because SvelteKit's $env/static/public bakes values at
 * build time, but Docker containers need runtime configuration.
 *
 * The set of injected URLs is intentionally short:
 *   - Auth          → mana-auth (login, sessions, GDPR endpoints)
 *   - Sync          → mana-sync (local-first push/pull/WS for every module)
 *   - Media         → mana-media (CAS / thumbnails)
 *   - LLM           → mana-llm (server-side LLM proxy)
 *   - Events        → mana-events (public RSVP flow)
 *   - Uload server  → standalone short-link redirect/click tracking
 *   - Memoro server → standalone voice memo processing
 *   - Glitchtip DSN → client-side error reporting
 *
 * Per-app HTTP backends (todo-api, calendar-api, contacts-api, chat-api,
 * storage-api, cards-api, mukke-api, nutriphi-api, picture-api, presi-api,
 * zitare-api, clock-api, context-api) were removed in the pre-launch
 * ghost-API cleanup — every product module now talks to mana-sync directly.
 */

const PUBLIC_MANA_AUTH_URL_CLIENT =
	process.env.PUBLIC_MANA_AUTH_URL_CLIENT || process.env.PUBLIC_MANA_AUTH_URL || '';
const PUBLIC_GLITCHTIP_DSN = process.env.PUBLIC_GLITCHTIP_DSN || '';

const PUBLIC_SYNC_SERVER_URL_CLIENT =
	process.env.PUBLIC_SYNC_SERVER_URL_CLIENT || process.env.PUBLIC_SYNC_SERVER_URL || '';
const PUBLIC_ULOAD_SERVER_URL_CLIENT =
	process.env.PUBLIC_ULOAD_SERVER_URL_CLIENT || process.env.PUBLIC_ULOAD_SERVER_URL || '';
// memoro-server is intentionally not injected — the unified web app's memoro
// module is fully local-first (recorder + Dexie + sync) and never calls the
// standalone server. The memoro-server compose service still exists for the
// mobile app, but mana.how does not depend on it.
const PUBLIC_MANA_MEDIA_URL_CLIENT =
	process.env.PUBLIC_MANA_MEDIA_URL_CLIENT || process.env.PUBLIC_MANA_MEDIA_URL || '';
const PUBLIC_MANA_LLM_URL_CLIENT =
	process.env.PUBLIC_MANA_LLM_URL_CLIENT || process.env.PUBLIC_MANA_LLM_URL || '';
const PUBLIC_MANA_EVENTS_URL_CLIENT =
	process.env.PUBLIC_MANA_EVENTS_URL_CLIENT || process.env.PUBLIC_MANA_EVENTS_URL || '';

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
	'music',
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
window.__PUBLIC_MANA_AUTH_URL__ = ${JSON.stringify(PUBLIC_MANA_AUTH_URL_CLIENT)};
window.__PUBLIC_SYNC_SERVER_URL__ = ${JSON.stringify(PUBLIC_SYNC_SERVER_URL_CLIENT)};
window.__PUBLIC_ULOAD_SERVER_URL__ = ${JSON.stringify(PUBLIC_ULOAD_SERVER_URL_CLIENT)};
window.__PUBLIC_MANA_MEDIA_URL__ = ${JSON.stringify(PUBLIC_MANA_MEDIA_URL_CLIENT)};
window.__PUBLIC_MANA_LLM_URL__ = ${JSON.stringify(PUBLIC_MANA_LLM_URL_CLIENT)};
window.__PUBLIC_MANA_EVENTS_URL__ = ${JSON.stringify(PUBLIC_MANA_EVENTS_URL_CLIENT)};
window.__PUBLIC_GLITCHTIP_DSN__ = ${JSON.stringify(PUBLIC_GLITCHTIP_DSN)};
</script>`;
			return injectUmamiAnalytics(html.replace('<head>', `<head>${envScript}`));
		},
	});

	const isDev = process.env.NODE_ENV !== 'production';
	setSecurityHeaders(response, {
		connectSrc: [
			PUBLIC_MANA_AUTH_URL_CLIENT,
			PUBLIC_SYNC_SERVER_URL_CLIENT,
			PUBLIC_ULOAD_SERVER_URL_CLIENT,
			PUBLIC_MANA_MEDIA_URL_CLIENT,
			PUBLIC_MANA_LLM_URL_CLIENT,
			PUBLIC_MANA_EVENTS_URL_CLIENT,
			'wss://sync.mana.how',
			// Allow all localhost ports in development
			...(isDev ? ['http://localhost:*', 'ws://localhost:*'] : []),
		].filter(Boolean),
	});

	return response;
};
