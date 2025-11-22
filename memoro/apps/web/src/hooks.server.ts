/**
 * Server-side hooks for SvelteKit
 * Implements custom CSRF protection that allows OAuth callbacks
 */

import type { Handle } from '@sveltejs/kit';

// Routes that are allowed to receive cross-origin POST requests
// (OAuth callbacks from external providers)
const ALLOWED_PATHS = [
	'/auth/apple-callback-handler', // Apple Sign-In OAuth callback (server endpoint)
	'/auth/apple-callback', // Apple Sign-In OAuth callback (legacy/fallback)
	'/auth/google-callback' // Google Sign-In OAuth callback (if needed)
];

/**
 * Custom CSRF protection that allows specific OAuth callback routes
 * while protecting all other routes
 */
export const handle: Handle = async ({ event, resolve }) => {
	const { request, url } = event;

	// Only check POST, PATCH, PUT, DELETE requests
	if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
		const origin = request.headers.get('origin');
		const forbidden =
			origin !== null &&
			origin !== url.origin &&
			!ALLOWED_PATHS.some((path) => url.pathname === path);

		if (forbidden) {
			// Log the blocked request for debugging
			console.warn('CSRF: Blocked cross-origin request:', {
				method: request.method,
				path: url.pathname,
				origin: origin,
				expectedOrigin: url.origin
			});

			return new Response('Cross-site POST form submissions are forbidden', {
				status: 403
			});
		}
	}

	// Allow the request to proceed
	return resolve(event);
};
