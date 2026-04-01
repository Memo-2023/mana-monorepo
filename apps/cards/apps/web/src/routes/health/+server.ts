import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({
		status: 'ok',
		service: 'manadeck-web',
		timestamp: new Date().toISOString(),
	});
};
