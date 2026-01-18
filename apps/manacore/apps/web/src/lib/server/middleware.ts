import { MIDDLEWARE_URL } from '$env/static/private';

/**
 * Server-side only middleware client
 * The middleware URL is kept private and not exposed to the browser
 */
export async function callMiddleware(
	endpoint: string,
	options: {
		method?: string;
		body?: any;
		headers?: Record<string, string>;
	} = {}
) {
	const url = `${MIDDLEWARE_URL}${endpoint}`;

	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
		body: options.body ? JSON.stringify(options.body) : undefined,
	});

	if (!response.ok) {
		throw new Error(`Middleware error: ${response.statusText}`);
	}

	return response.json();
}
