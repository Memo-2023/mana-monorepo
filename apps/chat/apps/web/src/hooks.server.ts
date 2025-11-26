/**
 * Server Hooks for SvelteKit
 * Auth is now handled client-side via Mana Core Auth
 */

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event);
};
