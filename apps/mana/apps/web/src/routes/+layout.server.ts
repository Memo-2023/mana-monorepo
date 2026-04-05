import type { LayoutServerLoad } from './$types';

/**
 * Server layout load - minimal, auth handled by mana-auth client-side
 */
export const load: LayoutServerLoad = async () => {
	return {};
};
