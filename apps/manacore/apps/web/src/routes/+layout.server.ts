import type { LayoutServerLoad } from './$types';

/**
 * Server layout load - minimal, auth handled by mana-core-auth client-side
 */
export const load: LayoutServerLoad = async () => {
	return {};
};
