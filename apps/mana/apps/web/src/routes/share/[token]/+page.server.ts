/**
 * Share-Link SSR loader.
 *
 * Fetches the unlisted snapshot blob from mana-api and passes it to
 * the dispatcher page. The page picks the right per-collection
 * component and renders statically. No client-side hydration of the
 * user's encrypted data — everything the visitor sees is this blob.
 *
 * See docs/plans/unlisted-sharing.md §5.
 */

import { error } from '@sveltejs/kit';
import { getManaApiUrl } from '$lib/api/config';
import type { PageServerLoad } from './$types';

export interface SnapshotResponse {
	token: string;
	collection: string;
	blob: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
	expiresAt: string | null;
}

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const token = params.token;
	if (!token || !/^[A-Za-z0-9_-]{32}$/.test(token)) {
		error(404, 'Link nicht gefunden');
	}

	const res = await fetch(`${getManaApiUrl()}/api/v1/unlisted/public/${token}`);

	if (res.status === 404) error(404, 'Link nicht gefunden');
	if (res.status === 410) {
		const body = await res.json().catch(() => ({ code: 'GONE' }));
		const message = body.code === 'EXPIRED' ? 'Link ist abgelaufen' : 'Link wurde widerrufen';
		error(410, message);
	}
	if (!res.ok) error(502, 'Fehler beim Laden des geteilten Inhalts');

	const payload = (await res.json()) as SnapshotResponse;

	// Short private cache — revocation at the source propagates in ≤60s.
	// noindex as both header and meta tag keeps search engines out.
	setHeaders({
		'cache-control': 'private, max-age=60',
		'x-robots-tag': 'noindex, nofollow',
	});

	return payload;
};
