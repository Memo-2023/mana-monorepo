import type { APIRoute } from 'astro';
import { submitComment, getComments } from '../../utils/api';

export const GET: APIRoute = async ({ url }) => {
	const softwareId = url.searchParams.get('softwareId');

	if (softwareId) {
		try {
			const comments = await getComments(softwareId);
			return new Response(JSON.stringify(comments), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		} catch (error) {
			return new Response(JSON.stringify([]), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	}

	return new Response(JSON.stringify({ message: 'Comment API is working' }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

export const POST: APIRoute = async ({ request }) => {
	try {
		const bodyText = await request.text();

		let parsedData;
		try {
			parsedData = JSON.parse(bodyText);
		} catch (parseError) {
			return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const { softwareId, userName, comment } = parsedData;

		// Validate input
		if (!softwareId || !userName || !comment) {
			return new Response(JSON.stringify({ error: 'Missing required fields' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Forward to backend
		const result = await submitComment(softwareId, userName, comment);

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error processing comment request:', error);
		return new Response(
			JSON.stringify({ error: 'Failed to process comment request' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
};
