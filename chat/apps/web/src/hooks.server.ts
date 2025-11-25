/**
 * Server Hooks for SvelteKit
 * Handles Supabase session management
 */

import type { Handle } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/services/supabase';

export const handle: Handle = async ({ event, resolve }) => {
  // Create Supabase client for this request
  event.locals.supabase = createSupabaseServerClient(event.cookies);

  // Get session
  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();

    if (!session) {
      return { session: null, user: null };
    }

    // Validate user (not just reading from cookies)
    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser();

    if (error) {
      return { session: null, user: null };
    }

    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    },
  });
};
