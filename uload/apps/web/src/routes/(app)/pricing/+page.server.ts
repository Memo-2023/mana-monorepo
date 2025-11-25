import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		user: locals.user
			? {
					email: locals.user.email,
					username: locals.user.username
				}
			: null
	};
};
