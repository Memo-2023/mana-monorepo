/**
 * Server Hooks for SvelteKit
 * Auth is handled client-side via Mana Core Auth
 * Supabase is still used for database operations
 *
 * TODO: Migrate API routes to use Mana Core Auth headers instead of session-based auth
 */

import { createClient } from '$lib/supabase/server';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Create Supabase client for database operations
	event.locals.supabase = createClient(event);

	// Provide session helpers for backwards compatibility
	// These are stubs while transitioning to Mana Core Auth
	event.locals.safeGetSession = async () => {
		// In the future, this should validate the Mana Core Auth token
		// For now, return a mock session for development
		const {
			data: { session },
			error,
		} = await event.locals.supabase.auth.getSession();
		if (error || !session) {
			return { session: null, user: null };
		}
		return { session, user: session.user };
	};

	event.locals.getSession = async () => {
		const { session } = await event.locals.safeGetSession();
		return session;
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		},
	});
};
