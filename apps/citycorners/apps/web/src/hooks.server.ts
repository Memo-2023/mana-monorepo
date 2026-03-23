import type { Handle } from '@sveltejs/kit';

const PUBLIC_MANA_CORE_AUTH_URL_CLIENT = process.env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT || '';
const PUBLIC_BACKEND_URL_CLIENT =
	process.env.PUBLIC_CITYCORNERS_API_URL_CLIENT || process.env.PUBLIC_BACKEND_URL || '';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			return html
				.replace('%env:PUBLIC_MANA_CORE_AUTH_URL_CLIENT%', PUBLIC_MANA_CORE_AUTH_URL_CLIENT)
				.replace('%env:PUBLIC_MANA_CORE_AUTH_URL%', process.env.PUBLIC_MANA_CORE_AUTH_URL || '')
				.replace('%env:PUBLIC_BACKEND_URL_CLIENT%', PUBLIC_BACKEND_URL_CLIENT)
				.replace('%env:PUBLIC_BACKEND_URL%', process.env.PUBLIC_BACKEND_URL || '');
		},
	});

	return response;
};
