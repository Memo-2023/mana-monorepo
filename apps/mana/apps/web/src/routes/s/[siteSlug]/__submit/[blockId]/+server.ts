/**
 * Form-submit proxy — forwards the visitor's POST to the mana-api
 * public submit endpoint. Keeps the submission on the same origin as
 * the public page so no CORS preflight is needed and the visitor's
 * session state (if any) isn't fiddled with.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getManaApiUrl } from '$lib/api/config';

export const POST: RequestHandler = async ({ params, request, getClientAddress }) => {
	const { siteSlug, blockId } = params;
	if (!siteSlug || !blockId) {
		return json({ error: 'siteSlug + blockId required' }, { status: 400 });
	}

	const body = await request.text();

	// Forward client IP + user-agent so the api can rate-limit + store
	// them. SvelteKit's `getClientAddress()` respects the usual proxy
	// headers (X-Forwarded-For, Cloudflare's CF-Connecting-IP).
	const forwardedIp = getClientAddress();
	const userAgent = request.headers.get('user-agent') ?? '';

	const upstream = await fetch(
		`${getManaApiUrl()}/api/v1/website/public/submit/${encodeURIComponent(siteSlug)}/${encodeURIComponent(blockId)}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Forwarded-For': forwardedIp,
				'User-Agent': userAgent,
			},
			body,
		}
	);

	const data = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;
	return json(data, { status: upstream.status });
};
