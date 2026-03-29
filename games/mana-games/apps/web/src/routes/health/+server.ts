import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return new Response(
		JSON.stringify({
			status: 'ok',
			service: 'mana-games-web',
			timestamp: new Date().toISOString(),
		}),
		{
			headers: { 'Content-Type': 'application/json' },
		}
	);
};
