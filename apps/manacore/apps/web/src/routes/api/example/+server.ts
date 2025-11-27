import { json, error } from '@sveltejs/kit';
import { callMiddleware } from '$lib/server/middleware';
import type { RequestHandler } from './$types';

/**
 * Example API route that proxies to the middleware
 * The middleware URL stays hidden on the server
 */
export const GET: RequestHandler = async ({ locals: { session } }) => {
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Call middleware from server-side only
		// The middleware URL is never exposed to the client
		const data = await callMiddleware('/api/some-endpoint', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${session.access_token}`,
			},
		});

		return json(data);
	} catch (err) {
		console.error('Middleware call failed:', err);
		throw error(500, 'Failed to fetch data from middleware');
	}
};
