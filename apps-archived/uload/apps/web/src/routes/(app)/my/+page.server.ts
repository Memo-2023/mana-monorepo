import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Redirect to links page, preserving any query parameters (like workspace)
	const searchParams = url.searchParams.toString();
	const redirectUrl = searchParams ? `/my/links?${searchParams}` : '/my/links';
	throw redirect(302, redirectUrl);
};
