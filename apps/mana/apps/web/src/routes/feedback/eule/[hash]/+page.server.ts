import { error } from '@sveltejs/kit';
import { getManaAnalyticsUrl } from '$lib/api/config';
import type { EulenProfileResponse } from '@mana/feedback';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
	const { hash } = params;
	if (!/^[0-9a-f]{32,64}$/i.test(hash)) error(404, 'Eulen-Profil nicht gefunden');

	const res = await fetch(`${getManaAnalyticsUrl()}/api/v1/public/feedback/eule/${hash}`);
	if (res.status === 400 || res.status === 404) error(404, 'Eulen-Profil nicht gefunden');
	if (!res.ok) error(502, 'Fehler beim Laden');

	const data = (await res.json()) as EulenProfileResponse;

	setHeaders({
		'cache-control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=600',
	});

	return data;
};
