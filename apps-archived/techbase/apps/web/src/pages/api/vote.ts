import type { APIRoute } from 'astro';
import { submitVote } from '../../utils/api';

export const POST: APIRoute = async ({ request }) => {
	try {
		const bodyText = await request.text();

		let parsedData;
		try {
			parsedData = JSON.parse(bodyText);
		} catch (parseError) {
			return new Response(JSON.stringify({ error: 'Invalid JSON in vote request' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const { softwareId, metric, rating } = parsedData;

		// Validate input
		if (!softwareId || !metric || !rating || isNaN(Number(rating))) {
			return new Response(JSON.stringify({ error: 'Invalid vote data' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Forward to backend
		const result = await submitVote(softwareId, metric, Number(rating));

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error processing vote request:', error);
		return new Response(
			JSON.stringify({ error: 'Failed to process vote request' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
};
