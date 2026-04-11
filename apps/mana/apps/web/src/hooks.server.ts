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
const PUBLIC_MANA_API_URL_CLIENT =
	process.env.PUBLIC_MANA_API_URL_CLIENT || process.env.PUBLIC_MANA_API_URL || '';
const PUBLIC_MANA_CREDITS_URL_CLIENT =
	process.env.PUBLIC_MANA_CREDITS_URL_CLIENT || process.env.PUBLIC_MANA_CREDITS_URL || '';

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
	'inventory',
	'times',
	'uload',
	'memoro',
	'context',
	'questions',
	'moodlit',
]);

export const handle: Handle = async ({ event, resolve }) => {
	// Force HTTPS in production. Cloudflare forwards HTTP requests to the
	// origin without rewriting the scheme, so without this redirect a user
	// who types `mana.how` (no scheme → HTTP default) loads the page over
	// HTTP and the browser then sends `Origin: http://mana.how` on every
	// fetch. mana-auth's CORS only allows `https://mana.how`, so all auth
	// requests fail and the loader hangs forever.
	const host = event.request.headers.get('host') || '';
	const cfVisitor = event.request.headers.get('cf-visitor'); // {"scheme":"http"|"https"}
	const xfProto = event.request.headers.get('x-forwarded-proto');
	const isHttp =
		(cfVisitor && cfVisitor.includes('"scheme":"http"')) ||
		xfProto === 'http' ||
		(event.url.protocol === 'http:' && !cfVisitor && !xfProto);
	const isLocal = host.startsWith('localhost') || host.startsWith('127.');
	if (isHttp && !isLocal) {
		return new Response(null, {
			status: 301,
			headers: { Location: `https://${host}${event.url.pathname}${event.url.search}` },
		});
	}

	// Redirect app subdomains to their path equivalent
	// e.g. todo.mana.how → mana.how/todo
	const subdomain = host.split('.')[0]; // host already declared above
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
window.__PUBLIC_MANA_API_URL__ = ${JSON.stringify(PUBLIC_MANA_API_URL_CLIENT)};
window.__PUBLIC_MANA_CREDITS_URL__ = ${JSON.stringify(PUBLIC_MANA_CREDITS_URL_CLIENT)};
window.__PUBLIC_GLITCHTIP_DSN__ = ${JSON.stringify(PUBLIC_GLITCHTIP_DSN)};
</script>`;
			return injectUmamiAnalytics(html.replace('<head>', `<head>${envScript}`));
		},
	});

	const isDev = process.env.NODE_ENV !== 'production';
	setSecurityHeaders(response, {
		// @huggingface/transformers (used by @mana/local-llm) lazy-loads the
		// onnxruntime-web WASM loader from jsDelivr at backend selection
		// time via a dynamic import(). Browsers route dynamic imports
		// through script-src.
		//
		// `blob:` is also required because once the loader .mjs is fetched,
		// onnxruntime-web wraps it in `URL.createObjectURL(new Blob([...]))`
		// and instantiates the result as a multi-threaded Web Worker. The
		// blob URL scheme is its own CSP source — we only allow it for
		// our own origin (the implicit base of blob: is the document
		// origin), so this can't be used to load remote scripts.
		scriptSrc: ['https://cdn.jsdelivr.net', 'blob:'],
		connectSrc: [
			PUBLIC_MANA_AUTH_URL_CLIENT,
			PUBLIC_SYNC_SERVER_URL_CLIENT,
			PUBLIC_ULOAD_SERVER_URL_CLIENT,
			PUBLIC_MANA_MEDIA_URL_CLIENT,
			PUBLIC_MANA_LLM_URL_CLIENT,
			PUBLIC_MANA_EVENTS_URL_CLIENT,
			PUBLIC_MANA_API_URL_CLIENT,
			PUBLIC_MANA_CREDITS_URL_CLIENT,
			'wss://sync.mana.how',
			// transformers.js *also* fetch()es the .wasm binary and the .mjs
			// loader factory directly to pre-warm the runtime — those go
			// through connect-src, not script-src, so jsDelivr has to be in
			// both lists for the WebGPU backend resolver to succeed.
			'https://cdn.jsdelivr.net',
			// @mana/local-llm (transformers.js) pulls model config + ONNX
			// shards from the HuggingFace ecosystem. HF currently uses three
			// distinct CDN domains depending on file type and rollout state:
			//   - huggingface.co              → repo metadata + small files
			//   - *.huggingface.co            → cdn-lfs-* hosts for legacy LFS
			//   - *.hf.co                     → the new XET-backed CDN
			//                                   (cas-bridge.xethub.hf.co etc.)
			// We allow the broad wildcards because HF rotates the exact host
			// names and a new path lands on a different bucket every few
			// months. Adding the narrow ones too keeps older clients happy.
			'https://huggingface.co',
			'https://*.huggingface.co',
			'https://cdn-lfs.huggingface.co',
			'https://cdn-lfs-us-1.huggingface.co',
			'https://*.hf.co',
			'https://cas-bridge.xethub.hf.co',
			'https://raw.githubusercontent.com',
			// Allow all localhost ports in development
			...(isDev ? ['http://localhost:*', 'ws://localhost:*'] : []),
		].filter(Boolean),
	});

	return response;
};
