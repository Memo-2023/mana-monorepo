import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return new Response(
		JSON.stringify({
			status: 'ok',
			service: 'arcade-web',
			timestamp: new Date().toISOString(),
		}),
		{
			headers: { 'Content-Type': 'application/json' },
		}
	);
};
