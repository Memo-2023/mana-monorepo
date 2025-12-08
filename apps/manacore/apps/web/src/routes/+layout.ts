import { waitLocale } from '$lib/i18n';
import '$lib/i18n'; // This triggers the init() call at module scope
import type { LayoutLoad } from './$types';

/**
 * Layout load function
 *
 * Auth is handled entirely by Mana Core Auth (@manacore/shared-auth).
 * No Supabase is needed - all data comes from mana-core-auth APIs.
 */
export const load: LayoutLoad = async () => {
	await waitLocale();
	return {};
};
