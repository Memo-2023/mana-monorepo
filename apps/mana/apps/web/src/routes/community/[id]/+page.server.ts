import { error } from '@sveltejs/kit';
import { getManaAnalyticsUrl } from '$lib/api/config';
import type { PageServerLoad } from './$types';
import type { PublicItemResponse } from '@mana/feedback';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const { id } = params;
	if (!id || !/^[0-9a-f-]{36}$/i.test(id)) error(404, 'Eintrag nicht gefunden');

	const res = await fetch(`${getManaAnalyticsUrl()}/api/v1/public/feedback/${id}`);
	if (res.status === 404) error(404, 'Eintrag nicht gefunden');
	if (!res.ok) error(502, 'Fehler beim Laden');

	const data = (await res.json()) as PublicItemResponse;

	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=600',
	});

	return data;
};
