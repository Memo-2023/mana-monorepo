import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/public';
import { dev } from '$app/environment';

// Alternative verification endpoint that redirects to PocketBase's built-in verification
export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		// No token - redirect to login with error
		redirect(303, '/login?error=missing-token');
	}

	// Get the correct PocketBase URL based on environment
	const pbUrl = env.PUBLIC_POCKETBASE_URL || (dev ? 'http://localhost:8090' : 'https://pb.ulo.ad');
	
	// Redirect to PocketBase's built-in verification endpoint
	// PocketBase will handle the verification and show its own success/error page
	redirect(303, `${pbUrl}/_/#/auth/confirm-verification/${token}`);
};
