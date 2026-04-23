/**
 * Public website renderer — loads the current published snapshot and
 * hands it to every child route.
 *
 * This route is OUTSIDE the (app) group — no auth, no AuthGate, no
 * Dexie. Everything is SSR from Postgres via the mana-api public
 * endpoint.
 */

import { error } from '@sveltejs/kit';
import { getManaApiUrl } from '$lib/api/config';
import type { LayoutServerLoad } from './$types';
import type { SnapshotSite, SnapshotPage } from '$lib/modules/website/publish';

interface PublicSnapshotResponse {
	snapshotId: string;
	slug: string;
	publishedAt: string;
	blob: {
		version: string;
		site: SnapshotSite;
		pages: SnapshotPage[];
		publishedAt: string;
		publishedBy: string;
	};
}

export const load: LayoutServerLoad = async ({ params, fetch, setHeaders }) => {
	const slug = params.siteSlug;
	if (!slug) error(404, 'Not found');

	const res = await fetch(`${getManaApiUrl()}/api/v1/website/public/sites/${slug}`, {
		headers: { Accept: 'application/json' },
	});

	if (res.status === 404) error(404, 'Website not found');
	if (!res.ok) error(502, 'Upstream error fetching published site');

	const payload = (await res.json()) as PublicSnapshotResponse;

	// Mirror the edge-cache hint from the API so that SvelteKit's own
	// adapter respects it. `page` data isn't personalized for public
	// sites, so the short freshness window is safe.
	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
	});

	return {
		snapshot: payload.blob,
		snapshotId: payload.snapshotId,
		publishedAt: payload.publishedAt,
	};
};
