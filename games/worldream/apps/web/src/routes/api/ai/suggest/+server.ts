import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateSuggestions } from '$lib/ai/openai';
import { OPENAI_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!OPENAI_API_KEY) {
		return json({ error: 'OpenAI API key not configured' }, { status: 500 });
	}

	try {
		const { field, context } = await request.json();

		if (!field || !context?.kind) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const suggestions = await generateSuggestions(field, context);

		return json({ suggestions });
	} catch (error) {
		console.error('AI suggestion error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to generate suggestions',
			},
			{ status: 500 }
		);
	}
};
