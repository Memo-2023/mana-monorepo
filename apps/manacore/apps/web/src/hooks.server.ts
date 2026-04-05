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

// Sync server URL (WebSocket)
const PUBLIC_SYNC_SERVER_URL_CLIENT =
	process.env.PUBLIC_SYNC_SERVER_URL_CLIENT || process.env.PUBLIC_SYNC_SERVER_URL || '';

// Additional backend URLs
const PUBLIC_CHAT_API_URL_CLIENT =
	process.env.PUBLIC_CHAT_API_URL_CLIENT || process.env.PUBLIC_CHAT_API_URL || '';
const PUBLIC_STORAGE_API_URL_CLIENT =
	process.env.PUBLIC_STORAGE_API_URL_CLIENT || process.env.PUBLIC_STORAGE_API_URL || '';
const PUBLIC_CARDS_API_URL_CLIENT =
	process.env.PUBLIC_CARDS_API_URL_CLIENT || process.env.PUBLIC_CARDS_API_URL || '';
const PUBLIC_MUSIC_API_URL_CLIENT =
	process.env.PUBLIC_MUSIC_API_URL_CLIENT || process.env.PUBLIC_MUSIC_API_URL || '';
const PUBLIC_NUTRIPHI_API_URL_CLIENT =
	process.env.PUBLIC_NUTRIPHI_API_URL_CLIENT || process.env.PUBLIC_NUTRIPHI_API_URL || '';
const PUBLIC_ULOAD_SERVER_URL_CLIENT =
	process.env.PUBLIC_ULOAD_SERVER_URL_CLIENT || process.env.PUBLIC_ULOAD_SERVER_URL || '';
const PUBLIC_MEMORO_SERVER_URL_CLIENT =
	process.env.PUBLIC_MEMORO_SERVER_URL_CLIENT || process.env.PUBLIC_MEMORO_SERVER_URL || '';
const PUBLIC_MANA_MEDIA_URL_CLIENT =
	process.env.PUBLIC_MANA_MEDIA_URL_CLIENT || process.env.PUBLIC_MANA_MEDIA_URL || '';
const PUBLIC_MANA_LLM_URL_CLIENT =
	process.env.PUBLIC_MANA_LLM_URL_CLIENT || process.env.PUBLIC_MANA_LLM_URL || '';

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
window.__PUBLIC_MANA_CORE_AUTH_URL__ = ${JSON.stringify(PUBLIC_MANA_CORE_AUTH_URL_CLIENT)};
window.__PUBLIC_TODO_API_URL__ = ${JSON.stringify(PUBLIC_TODO_API_URL_CLIENT)};
window.__PUBLIC_CALENDAR_API_URL__ = ${JSON.stringify(PUBLIC_CALENDAR_API_URL_CLIENT)};
window.__PUBLIC_CLOCK_API_URL__ = ${JSON.stringify(PUBLIC_CLOCK_API_URL_CLIENT)};
window.__PUBLIC_CONTACTS_API_URL__ = ${JSON.stringify(PUBLIC_CONTACTS_API_URL_CLIENT)};
window.__PUBLIC_SYNC_SERVER_URL__ = ${JSON.stringify(PUBLIC_SYNC_SERVER_URL_CLIENT)};
window.__PUBLIC_CHAT_API_URL__ = ${JSON.stringify(PUBLIC_CHAT_API_URL_CLIENT)};
window.__PUBLIC_STORAGE_API_URL__ = ${JSON.stringify(PUBLIC_STORAGE_API_URL_CLIENT)};
window.__PUBLIC_CARDS_API_URL__ = ${JSON.stringify(PUBLIC_CARDS_API_URL_CLIENT)};
window.__PUBLIC_MUSIC_API_URL__ = ${JSON.stringify(PUBLIC_MUSIC_API_URL_CLIENT)};
window.__PUBLIC_NUTRIPHI_API_URL__ = ${JSON.stringify(PUBLIC_NUTRIPHI_API_URL_CLIENT)};
window.__PUBLIC_ULOAD_SERVER_URL__ = ${JSON.stringify(PUBLIC_ULOAD_SERVER_URL_CLIENT)};
window.__PUBLIC_MEMORO_SERVER_URL__ = ${JSON.stringify(PUBLIC_MEMORO_SERVER_URL_CLIENT)};
window.__PUBLIC_MANA_MEDIA_URL__ = ${JSON.stringify(PUBLIC_MANA_MEDIA_URL_CLIENT)};
window.__PUBLIC_MANA_LLM_URL__ = ${JSON.stringify(PUBLIC_MANA_LLM_URL_CLIENT)};
window.__PUBLIC_GLITCHTIP_DSN__ = ${JSON.stringify(PUBLIC_GLITCHTIP_DSN)};
</script>`;
			return injectUmamiAnalytics(html.replace('<head>', `<head>${envScript}`));
		},
	});

	const isDev = process.env.NODE_ENV !== 'production';
	setSecurityHeaders(response, {
		connectSrc: [
			PUBLIC_MANA_CORE_AUTH_URL_CLIENT,
			PUBLIC_TODO_API_URL_CLIENT,
			PUBLIC_CALENDAR_API_URL_CLIENT,
			PUBLIC_CLOCK_API_URL_CLIENT,
			PUBLIC_CONTACTS_API_URL_CLIENT,
			PUBLIC_SYNC_SERVER_URL_CLIENT,
			PUBLIC_CHAT_API_URL_CLIENT,
			PUBLIC_STORAGE_API_URL_CLIENT,
			PUBLIC_CARDS_API_URL_CLIENT,
			PUBLIC_MUSIC_API_URL_CLIENT,
			PUBLIC_NUTRIPHI_API_URL_CLIENT,
			PUBLIC_ULOAD_SERVER_URL_CLIENT,
			PUBLIC_MEMORO_SERVER_URL_CLIENT,
			PUBLIC_MANA_MEDIA_URL_CLIENT,
			PUBLIC_MANA_LLM_URL_CLIENT,
			'wss://sync.mana.how',
			// Allow all localhost ports in development
			...(isDev ? ['http://localhost:*', 'ws://localhost:*'] : []),
		].filter(Boolean),
	});

	return response;
};
