/**
 * Same-origin proxy for /api/v1/geocode/* → mana-geocoding:3018
 *
 * Why this proxy exists
 * ---------------------
 * mana-geocoding is intentionally NOT exposed via Cloudflare — we decided
 * early on that geocoding queries (which leak "where the user is looking")
 * should never leave our infrastructure. That decision means the browser
 * can't reach the wrapper directly: `http://localhost:3018` is unreachable
 * in production and `http://mana-geocoding:3018` is only valid inside the
 * docker network.
 *
 * Same-origin proxy fixes this: the browser calls
 * `https://mana.how/api/v1/geocode/search?q=...`, SvelteKit (running in
 * the mana-web container on the same docker network as mana-geocoding)
 * forwards the request to `http://mana-geocoding:3018/api/v1/geocode/*`,
 * and the response comes back through the same path. No new Cloudflare
 * route, no geocoding traffic on the public internet.
 *
 * The shared client lib at `$lib/geocoding` points at `/api/v1/geocode`
 * (relative URL) so both server-side rendering and browser-side calls
 * land on this handler.
 *
 * No auth required — geocoding is pure lookup and has no per-user data.
 * If we ever want to rate-limit by user we can add JWT verification here
 * without touching the upstream service.
 *
 * Also proxies /health and /health/pelias so the SvelteKit status page
 * (/status) can check the service from its server side.
 */

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const UPSTREAM = process.env.MANA_GEOCODING_INTERNAL_URL || 'http://mana-geocoding:3018';
const PROXY_TIMEOUT_MS = 15_000;

async function forward(request: Request, pathSegments: string): Promise<Response> {
	const upstreamUrl = `${UPSTREAM}/api/v1/geocode/${pathSegments}`;
	const incomingUrl = new URL(request.url);
	const finalUrl = incomingUrl.search ? `${upstreamUrl}${incomingUrl.search}` : upstreamUrl;

	const headers = new Headers();
	const accept = request.headers.get('accept');
	if (accept) headers.set('accept', accept);

	const init: RequestInit = {
		method: request.method,
		headers,
		signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
	};

	let upstreamRes: Response;
	try {
		upstreamRes = await fetch(finalUrl, init);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		throw error(502, `geocoding proxy: ${message}`);
	}

	const responseHeaders = new Headers();
	const upstreamContentType = upstreamRes.headers.get('content-type');
	if (upstreamContentType) responseHeaders.set('content-type', upstreamContentType);
	// Allow the browser to cache identical geocoding results for a minute.
	// The wrapper also has its own 24h LRU, so this is just a hint.
	responseHeaders.set('cache-control', 'private, max-age=60');

	const body = await upstreamRes.text();
	return new Response(body, {
		status: upstreamRes.status,
		headers: responseHeaders,
	});
}

export const GET: RequestHandler = async ({ request, params }) => {
	return forward(request, params.path ?? '');
};
