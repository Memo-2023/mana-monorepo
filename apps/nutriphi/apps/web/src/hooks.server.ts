import { type Handle } from '@sveltejs/kit';

/**
 * Server hooks for Nutriphi Web
 * Authentication is handled client-side via Mana Middleware
 */
export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event);
};
