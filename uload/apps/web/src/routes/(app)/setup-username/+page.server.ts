import { redirect, fail } from '@sveltejs/kit';
import { validateUsername } from '$lib/username';
import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check if username is already set (and not temporary)
	const username = locals.user.username;
	if (
		username &&
		username !== '' &&
		!username.startsWith('temp_') &&
		!username.startsWith('user_')
	) {
		throw redirect(302, '/my');
	}

	return {
		user: locals.user
	};
};

export const actions = {
	setUsername: async ({ request, locals }) => {
		console.log('[SETUP-USERNAME] Action started');
		console.log('[SETUP-USERNAME] User:', locals.user?.id, locals.user?.email);
		console.log('[SETUP-USERNAME] Current username:', locals.user?.username);
		console.log('[SETUP-USERNAME] PB auth valid:', locals.pb?.authStore?.isValid);
		console.log('[SETUP-USERNAME] PB auth user:', locals.pb?.authStore?.model?.id);

		if (!locals.user) {
			console.error('[SETUP-USERNAME] No user in locals');
			throw redirect(302, '/login');
		}

		// Double-check username not already set (and not temporary)
		const currentUsername = locals.user.username;
		if (
			currentUsername &&
			currentUsername !== '' &&
			!currentUsername.startsWith('temp_') &&
			!currentUsername.startsWith('user_')
		) {
			console.log('[SETUP-USERNAME] Username already set, redirecting');
			throw redirect(302, '/my');
		}

		const data = await request.formData();
		const username = (data.get('username') as string)?.trim();
		console.log('[SETUP-USERNAME] New username to set:', username);

		// Validate username format
		const validation = validateUsername(username);
		console.log('[SETUP-USERNAME] Validation result:', validation);
		if (!validation.valid) {
			return fail(400, { error: validation.error });
		}

		// Check if username is already taken
		try {
			console.log('[SETUP-USERNAME] Checking if username exists...');
			const existingUser = await locals.pb
				.collection('users')
				.getFirstListItem(`username="${username}"`);

			console.log('[SETUP-USERNAME] Found existing user:', existingUser.id);
			// If we get here, username exists (and it's not ours)
			if (existingUser.id !== locals.user.id) {
				console.log('[SETUP-USERNAME] Username taken by another user');
				return fail(400, { error: 'Dieser Username ist bereits vergeben' });
			}
			console.log('[SETUP-USERNAME] Username belongs to current user');
		} catch (err) {
			// Username doesn't exist, we can use it
			console.log('[SETUP-USERNAME] Username is available');
		}

		// Update user with new username
		try {
			console.log('[SETUP-USERNAME] Attempting to update username...');
			console.log('[SETUP-USERNAME] User ID:', locals.user.id);
			console.log('[SETUP-USERNAME] New username:', username);
			console.log('[SETUP-USERNAME] PB instance exists:', !!locals.pb);
			console.log('[SETUP-USERNAME] PB auth valid before update:', locals.pb?.authStore?.isValid);

			const updatedUser = await locals.pb.collection('users').update(locals.user.id, {
				username: username
			});

			console.log('[SETUP-USERNAME] Update successful:', updatedUser.id, updatedUser.username);

			// Update locals
			locals.user = updatedUser;

			// Return success instead of redirect - handle redirect on client
			return { success: true, username: updatedUser.username };
		} catch (err: any) {
			// Check if it's a redirect (which is not an error)
			console.log('[SETUP-USERNAME] Caught error type:', typeof err);
			console.log('[SETUP-USERNAME] Error constructor:', err?.constructor?.name);
			console.log('[SETUP-USERNAME] Error status:', err?.status);
			console.log('[SETUP-USERNAME] Is Response?', err instanceof Response);

			// Check for SvelteKit redirect
			if (err?.status >= 300 && err?.status < 400 && err?.location) {
				console.log('[SETUP-USERNAME] SvelteKit redirect detected, re-throwing...');
				throw err;
			}

			// Also check if it's a Response object
			if (err instanceof Response && err.status >= 300 && err.status < 400) {
				console.log('[SETUP-USERNAME] Response redirect detected, re-throwing...');
				throw err;
			}

			console.error('[SETUP-USERNAME] Failed to update username:', err);
			// Log more details about the error
			if (err instanceof Error) {
				console.error('[SETUP-USERNAME] Error details:', {
					message: err.message,
					stack: err.stack,
					response: (err as any).response,
					data: (err as any).data,
					status: (err as any).status,
					originalError: (err as any).originalError
				});

				// Return more specific error message if available
				const errorMessage =
					(err as any).response?.message ||
					(err as any).data?.message ||
					err.message ||
					'Fehler beim Setzen des Usernamens';

				console.error('[SETUP-USERNAME] Returning error:', errorMessage);
				return fail(500, { error: errorMessage });
			}
			return fail(500, { error: 'Fehler beim Setzen des Usernamens' });
		}
	}
} satisfies Actions;
