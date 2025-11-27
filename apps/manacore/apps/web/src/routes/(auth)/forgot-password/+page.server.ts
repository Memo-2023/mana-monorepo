import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return fail(400, {
				error: 'Email is required',
				email,
			});
		}

		// Get the origin for the redirect URL
		const origin = url.origin;
		const redirectTo = `${origin}/auth/reset-password`;

		// Send password reset email
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo,
		});

		if (error) {
			console.error('Password reset error:', error);
			return fail(400, {
				error: error.message,
				email,
			});
		}

		// Return success (we don't reveal if the email exists for security)
		return {
			success: true,
			email,
		};
	},
};
