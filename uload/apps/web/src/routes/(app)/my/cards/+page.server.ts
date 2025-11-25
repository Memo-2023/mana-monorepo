import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Simple and clean - just return the user data
	// The parent layout already handles authentication
	// Cards are loaded client-side anyway
	
	return {
		user: locals.user,
		userCards: [] // Empty array, client will load cards
	};
};