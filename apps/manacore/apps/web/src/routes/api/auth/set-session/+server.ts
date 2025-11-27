import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
	try {
		const { access_token, refresh_token } = await request.json();

		if (!access_token || !refresh_token) {
			return json(
				{ success: false, error: 'Access token and refresh token are required' },
				{ status: 400 }
			);
		}

		// Set the session using the tokens from the URL hash
		const { data, error } = await supabase.auth.setSession({
			access_token,
			refresh_token,
		});

		if (error) {
			console.error('Set session error:', error);
			return json({ success: false, error: error.message }, { status: 400 });
		}

		if (!data.session) {
			return json({ success: false, error: 'Failed to create session' }, { status: 400 });
		}

		// Session is now set via cookies by the Supabase client
		return json({ success: true });
	} catch (error) {
		console.error('Unexpected error in set session:', error);
		return json({ success: false, error: 'An unexpected error occurred' }, { status: 500 });
	}
};
