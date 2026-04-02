/**
 * Protected routes layout server
 * Auth checking is now done client-side via Mana Core Auth
 */

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
	// Return the current path for client-side redirect logic
	return {
		pathname: url.pathname,
	};
};
