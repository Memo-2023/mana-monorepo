import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Create a singleton Supabase client
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
		detectSessionInUrl: false
	}
});

/**
 * Get authenticated Supabase client with Mana Core token
 * This injects the JWT token from Mana Core for RLS policies
 */
export async function getAuthenticatedSupabase(appToken?: string) {
	if (!appToken) {
		// Try to get token from sessionStorage
		if (typeof window !== 'undefined') {
			appToken = sessionStorage.getItem('appToken') || undefined;
		}
	}

	if (!appToken) {
		throw new Error('No auth token available');
	}

	// Create a new client instance with the auth token
	const authenticatedClient = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			headers: {
				Authorization: `Bearer ${appToken}`
			}
		},
		auth: {
			autoRefreshToken: false,
			persistSession: false,
			detectSessionInUrl: false
		}
	});

	return authenticatedClient;
}
