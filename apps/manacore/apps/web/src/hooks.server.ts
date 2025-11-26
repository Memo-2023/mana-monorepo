import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const supabase: Handle = async ({ event, resolve }) => {
	/**
	 * Creates a Supabase client specific to this server request.
	 */
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	}) as any;

	/**
	 * Unlike `supabase.auth.getSession()`, which returns the session _without_
	 * validating the JWT, this function also calls `getUser()` to validate the
	 * JWT before returning the session.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error) {
			// JWT validation has failed
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	// Log user data
	if (user) {
		console.log('=== AUTH GUARD ===');
		console.log('Path:', event.url.pathname);
		console.log('User ID:', user.id);
		console.log('User Email:', user.email);
		console.log('User metadata:', JSON.stringify(user.user_metadata, null, 2));
		console.log('Session expires at:', session?.expires_at);
		console.log('==================\n');
	}

	// Protect (app) routes - redirect to login if not authenticated
	if (!event.locals.session && event.url.pathname.startsWith('/(app)')) {
		redirect(303, '/login');
	}

	// Redirect to dashboard if already logged in and trying to access auth pages
	if (event.locals.session && (event.url.pathname === '/login' || event.url.pathname === '/register')) {
		redirect(303, '/dashboard');
	}

	return resolve(event);
};

export const handle: Handle = sequence(supabase, authGuard);
