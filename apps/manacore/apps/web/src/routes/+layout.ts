import { waitLocale } from '$lib/i18n';
import '$lib/i18n'; // This triggers the init() call at module scope
import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends }) => {
	await waitLocale();

	/**
	 * Declare a dependency so the layout will be invalidated when `invalidate('supabase:auth')` is called.
	 */
	depends('supabase:auth');

	// Create Supabase client for database operations only
	// Auth is handled by Mana Core Auth (@manacore/shared-auth)
	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch,
		},
		cookies: {
			getAll() {
				return data.cookies;
			},
			setAll(cookiesToSet) {
				// Browser client handles cookies automatically through the browser
				// This is a no-op as cookies are managed via document.cookie in the browser
			},
		},
	});

	// Note: Auth session is managed by Mana Core Auth via authStore,
	// not Supabase auth. Supabase is used for database operations only.
	return { supabase };
};
