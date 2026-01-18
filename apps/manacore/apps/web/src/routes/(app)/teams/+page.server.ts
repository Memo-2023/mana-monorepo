import type { PageServerLoad } from './$types';

/**
 * Teams page server load
 *
 * Note: Auth is now handled client-side via Mana Core Auth.
 * Data fetching will need to be done client-side with the auth token.
 */
export const load: PageServerLoad = async () => {
	// Return empty data - auth is handled client-side
	// TODO: Implement client-side data fetching with Mana Core Auth token
	return {
		teams: [],
	};
};
