/**
 * Same-origin proxy for /api/v1/who/* → mana-api:3060
 *
 * Why this proxy exists
 * ---------------------
 * The unified Hono/Bun apps/api server runs as the `mana-api`
 * container on the docker network. Browser requests to it would
 * normally go through https://mana-api.mana.how (cloudflared tunnel
 * route). That works once cloudflared has been restarted to pick up
 * the new ingress rule — but reloading the cloudflared LaunchDaemon
 * needs sudo, which the deploy automation doesn't have.
 *
 * Same-origin proxy via SvelteKit avoids the cloudflared dependency
 * entirely: the browser talks to https://mana.how/api/v1/who/* (an
 * origin that's already routed), this handler runs in the mana-web
 * container on the same docker network as mana-api, and the request
 * is forwarded to http://mana-api:3060/api/v1/who/* over the
 * internal network. Round-trip: browser → cloudflared → mana-web
 * → mana-api → mana-web → cloudflared → browser.
 *
 * The trade-off is one extra hop in the request path (mana-web in
 * the middle). It's measured in single-digit ms over a docker
 * bridge so the practical cost is invisible. The big win is that
 * the entire deploy is sudo-free.
 *
 * Auth header forwarding
 * ----------------------
 * The Authorization Bearer token from the incoming request is
 * passed straight through to mana-api — same as if the browser had
 * called mana-api directly. mana-api's authMiddleware validates the
 * JWT against the same JWKS endpoint either way.
 *
 * Other modules can use the same pattern as new compute paths land
 * (just rename the [...path] segment): /api/v1/calendar/[...path],
 * /api/v1/picture/[...path], etc. Or — if cloudflared eventually
 * gets a permanent mana-api.mana.how route — this proxy can be
 * deleted and getManaApiUrl() in lib/api/config.ts can point at the
 * full hostname again.
 */

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const UPSTREAM = process.env.MANA_API_INTERNAL_URL || 'http://mana-api:3060';
const PROXY_TIMEOUT_MS = 30_000;

async function forward(request: Request, pathSegments: string): Promise<Response> {
	const upstreamUrl = `${UPSTREAM}/api/v1/who/${pathSegments}`;
	const incomingUrl = new URL(request.url);
	const finalUrl = incomingUrl.search ? `${upstreamUrl}${incomingUrl.search}` : upstreamUrl;

	// Forward Authorization, Content-Type, and a few standard headers.
	// Drop hop-by-hop headers and host (so mana-api sees its own host).
	const headers = new Headers();
	const auth = request.headers.get('authorization');
	if (auth) headers.set('authorization', auth);
	const contentType = request.headers.get('content-type');
	if (contentType) headers.set('content-type', contentType);
	const accept = request.headers.get('accept');
	if (accept) headers.set('accept', accept);

	// Body: stream-through for POST/PUT/PATCH. GET/DELETE/HEAD: no body.
	const init: RequestInit = {
		method: request.method,
		headers,
		signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
	};
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		init.body = await request.text();
	}

	let upstreamRes: Response;
	try {
		upstreamRes = await fetch(finalUrl, init);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		// 502 reads better than 500 in browser DevTools when the proxy
		// itself can't reach the upstream — distinguishes "mana-api is
		// down" from "the handler crashed".
		throw error(502, `who proxy: ${message}`);
	}

	// Pass through the upstream status + JSON body.
	const responseHeaders = new Headers();
	const upstreamContentType = upstreamRes.headers.get('content-type');
	if (upstreamContentType) responseHeaders.set('content-type', upstreamContentType);

	const body = await upstreamRes.text();
	return new Response(body, {
		status: upstreamRes.status,
		headers: responseHeaders,
	});
}

export const GET: RequestHandler = async ({ request, params }) => {
	return forward(request, params.path ?? '');
};

export const POST: RequestHandler = async ({ request, params }) => {
	return forward(request, params.path ?? '');
};

export const PUT: RequestHandler = async ({ request, params }) => {
	return forward(request, params.path ?? '');
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	return forward(request, params.path ?? '');
};
