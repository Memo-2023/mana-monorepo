import type { Handle } from '@sveltejs/kit';

/**
 * Server hooks for ManaCore web app
 *
 * Authentication is handled entirely by Mana Core Auth (@manacore/shared-auth).
 * No Supabase is needed - all data comes from mana-core-auth APIs.
 */
export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
