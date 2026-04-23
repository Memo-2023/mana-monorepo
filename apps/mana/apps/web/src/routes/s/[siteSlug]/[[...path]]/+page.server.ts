/**
 * Public page resolver — picks the right page from the snapshot blob
 * by path. No extra fetch: the parent +layout.server.ts already loaded
 * the full snapshot.
 */

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { snapshot } = await parent();
	const rest = params.path ?? '';
	// `/` for the home route, `/about` / `/docs/foo` otherwise. Strip a
	// trailing slash (except the root itself).
	const targetPath = '/' + rest.replace(/\/$/, '');

	const page = snapshot.pages.find((p) => p.path === targetPath);
	if (!page) error(404, `Page "${targetPath}" not found`);

	return {
		page,
	};
};
