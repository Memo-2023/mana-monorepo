/**
 * Protected routes layout server
 * Validates session and redirects to login if not authenticated
 */

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { session, user } = await locals.safeGetSession();

  if (!session) {
    // Redirect to login with return URL
    const redirectTo = encodeURIComponent(url.pathname);
    redirect(303, `/login?redirectTo=${redirectTo}`);
  }

  return {
    session,
    user,
  };
};
