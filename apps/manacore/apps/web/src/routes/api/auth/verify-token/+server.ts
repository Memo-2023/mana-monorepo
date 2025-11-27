import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
	try {
		const { token, type } = await request.json();

		if (!token || type !== 'recovery') {
			return json({ success: false, error: 'Invalid token or type' }, { status: 400 });
		}

		// Verify the OTP token and create a session
		const { data, error } = await supabase.auth.verifyOtp({
			token_hash: token,
			type: 'recovery',
		});

		if (error) {
			console.error('Token verification error:', error);
			return json({ success: false, error: error.message }, { status: 400 });
		}

		if (!data.session) {
			return json({ success: false, error: 'Failed to create session' }, { status: 400 });
		}

		// Session is now set via cookies by the Supabase client
		return json({ success: true });
	} catch (error) {
		console.error('Unexpected error in token verification:', error);
		return json({ success: false, error: 'An unexpected error occurred' }, { status: 500 });
	}
};
