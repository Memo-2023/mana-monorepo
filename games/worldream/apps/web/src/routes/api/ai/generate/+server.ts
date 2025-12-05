import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateContent } from '$lib/ai/openai';
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
		const { kind, prompt, context, node_id } = await request.json();

		if (!kind || !prompt) {
			return json({ error: 'Missing required fields: kind and prompt' }, { status: 400 });
		}

		const result = await generateContent({
			kind,
			prompt,
			context,
		});

		// Optionally save to prompt history if node_id is provided
		if (node_id && locals.supabase) {
			await locals.supabase.from('prompt_history').insert({
				user_id: session.user.id,
				node_id,
				prompt,
				response: result,
				model: 'gpt-5-mini',
			});
		}

		return json(result);
	} catch (error) {
		console.error('AI generation error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to generate content',
			},
			{ status: 500 }
		);
	}
};
