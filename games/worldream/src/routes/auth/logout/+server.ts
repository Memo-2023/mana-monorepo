import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const { error } = await locals.supabase.auth.signOut();

	if (error) {
		console.error('Logout error:', error);
	}

	redirect(303, '/');
};
