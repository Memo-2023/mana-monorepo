import { fail } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is already logged in, they don't need password reset
	if (locals.user) {
		return {
			user: locals.user,
		};
	}
};

export const actions = {
	requestReset: async ({ request }) => {
		const formData = await request.formData();
		const email = (formData.get('email') as string)?.toLowerCase().trim();

		// Basic validation
		if (!email) {
			return fail(400, { error: 'Email is required' });
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'Please enter a valid email address' });
		}

		try {
			// Request password reset from PocketBase
			// This will send an email if the user exists
			await pb.collection('users').requestPasswordReset(email);

			console.log('Password reset requested for:', email);

			// Always return success to prevent email enumeration
			// Even if the email doesn't exist, we show success
			return {
				success: true,
			};
		} catch (err: any) {
			console.error('Password reset request error:', err);

			// Don't expose specific errors to prevent email enumeration
			// Always show generic success message
			return {
				success: true,
			};
		}
	},
} satisfies Actions;
