/**
 * SSR loader for the public community feed. Fetches from
 * /api/v1/public/feedback/feed (anonymous) so even cold-cache
 * unauthenticated visitors get pre-rendered content for SEO.
 */

import { getManaAnalyticsUrl } from '$lib/api/config';
import type { PageServerLoad } from './$types';
import type { PublicFeedListResponse } from '@mana/feedback';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	const url = `${getManaAnalyticsUrl()}/api/v1/public/feedback/feed?appId=mana&limit=50`;

	let items: PublicFeedListResponse['items'] = [];
	let error: string | null = null;
	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const body = (await res.json()) as PublicFeedListResponse;
		items = body.items;
	} catch (err) {
		console.warn('[community] SSR fetch failed:', err);
		error = err instanceof Error ? err.message : 'Laden fehlgeschlagen';
	}

	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=600',
	});

	return { items, error };
};
