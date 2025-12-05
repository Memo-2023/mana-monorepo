import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { editContentWithAI } from '$lib/ai/editing';
import type { ContentNode } from '$lib/types/content';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { nodeSlug, command } = await request.json();

		if (!nodeSlug || !command) {
			return json({ error: 'Missing required fields: nodeSlug, command' }, { status: 400 });
		}

		if (typeof command !== 'string' || command.trim().length === 0) {
			return json({ error: 'Command must be a non-empty string' }, { status: 400 });
		}

		const supabase = locals.supabase;

		// Get current node data
		const { data: node, error: fetchError } = await supabase
			.from('content_nodes')
			.select('*')
			.eq('slug', nodeSlug)
			.single();

		if (fetchError || !node) {
			return json({ error: 'Node not found' }, { status: 404 });
		}

		// Check ownership
		if (node.owner_id !== session.user.id) {
			return json({ error: 'Forbidden: You do not own this content' }, { status: 403 });
		}

		// Use AI to generate updates
		const updates = await editContentWithAI({
			node: node as ContentNode,
			command: command.trim(),
		});

		// Apply updates to database
		const { data: updatedNode, error: updateError } = await supabase
			.from('content_nodes')
			.update(updates)
			.eq('slug', nodeSlug)
			.select()
			.single();

		if (updateError) {
			console.error('Database update failed:', updateError);
			return json({ error: 'Failed to update content' }, { status: 500 });
		}

		return json({
			success: true,
			updatedNode,
			appliedUpdates: updates,
		});
	} catch (error) {
		console.error('AI editing failed:', error);

		if (error instanceof Error) {
			return json({ error: error.message }, { status: 500 });
		}

		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
