import { fail } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';
import type { Actions } from './$types';

export const actions = {
	resetPassword: async ({ request }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string;
		const password = formData.get('password') as string;
		const passwordConfirm = formData.get('passwordConfirm') as string;

		// Basic validation
		if (!token) {
			return fail(400, { error: 'Invalid reset token' });
		}

		if (!password || !passwordConfirm) {
			return fail(400, { error: 'Password is required' });
		}

		if (password !== passwordConfirm) {
			return fail(400, { error: 'Passwords do not match' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		try {
			// Confirm password reset with PocketBase
			await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm);

			console.log('Password reset successful');

			return {
				success: true
			};
		} catch (err: any) {
			console.error('Password reset error:', err);

			// Parse error response
			const errorData = err?.response?.data || err?.data || {};

			if (errorData.token) {
				return fail(400, { error: 'Invalid or expired reset token. Please request a new one.' });
			}

			if (errorData.password) {
				return fail(400, { error: errorData.password.message || 'Invalid password' });
			}

			// Generic error
			const message = err?.message || 'Failed to reset password. Please try again.';
			return fail(400, { error: message });
		}
	}
} satisfies Actions;
