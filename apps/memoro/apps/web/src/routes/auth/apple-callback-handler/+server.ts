/**
 * Server-side POST handler for Apple Sign-In callback
 *
 * This is a separate endpoint from the page route to avoid conflicts.
 * Apple POSTs to this endpoint, then we redirect to the page with query params.
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Disable CSRF protection for this endpoint since Apple is POSTing from their domain
export const config = {
	csrf: {
		checkOrigin: false
	}
};

export const POST: RequestHandler = async ({ request }) => {
	// Parse form data from Apple's form_post
	const formData = await request.formData();

	// Log received data for debugging
	console.log('Apple Sign-In POST callback received:', {
		hasCode: formData.has('code'),
		hasIdToken: formData.has('id_token'),
		hasState: formData.has('state'),
		hasUser: formData.has('user'),
		hasError: formData.has('error')
	});

	// Check for errors from Apple
	const error = formData.get('error');
	if (error) {
		console.error('Apple Sign-In error:', error, formData.get('error_description'));
		// Redirect to callback page with error
		throw redirect(303, `/auth/apple-callback?error=${encodeURIComponent(error.toString())}`);
	}

	// Extract OAuth parameters
	const code = formData.get('code');
	const id_token = formData.get('id_token');
	const state = formData.get('state');
	const user = formData.get('user');

	// Validate we have required data
	if (!code && !id_token) {
		console.error('No code or id_token received from Apple');
		throw redirect(303, '/auth/apple-callback?error=no_token');
	}

	// Build query parameters for client-side page
	const params = new URLSearchParams();

	// Add all parameters to query string
	if (code) params.set('code', code.toString());
	if (id_token) params.set('id_token', id_token.toString());
	if (state) params.set('state', state.toString());
	if (user) params.set('user', user.toString());

	// Redirect to client-side callback page with data in query params
	const redirectUrl = `/auth/apple-callback?${params.toString()}`;

	console.log('Redirecting to client-side callback with query params');
	throw redirect(303, redirectUrl);
};

export const GET: RequestHandler = async () => {
	// This endpoint should only receive POST from Apple
	console.warn('GET request to Apple callback handler - redirecting to login');
	throw redirect(303, '/login?error=invalid_request');
};
