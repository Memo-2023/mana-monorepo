import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Logout endpoint - redirects to login page
 * Actual logout is handled client-side by authStore.signOut()
 */
export const POST: RequestHandler = async () => {
	redirect(303, '/auth/login');
};
