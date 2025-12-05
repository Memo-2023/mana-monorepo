import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MemoryService } from '$lib/services/memoryService';
import { createClient } from '$lib/supabase/server';

// POST /api/nodes/[slug]/memory/process - Process and age memories
export const POST: RequestHandler = async (event) => {
	const { params, request, locals } = event;
	const { slug } = params;
	const supabase = createClient(event);

	try {
		// Get authenticated user
		const { user } = await locals.safeGetSession();
		if (!user) {
			throw error(401, 'Unauthorized');
		}

		// Verify node and ownership
		const { data: node, error: nodeError } = await supabase
			.from('content_nodes')
			.select('id, owner_id')
			.eq('slug', slug)
			.single();

		if (nodeError || !node) {
			throw error(404, 'Node not found');
		}

		if (node.owner_id !== user.id) {
			throw error(403, "You do not have permission to process this node's memory");
		}

		const body = await request.json();
		const { current_date } = body;

		const processedMemory = await MemoryService.processMemories(
			node.id,
			current_date ? new Date(current_date) : undefined
		);

		if (!processedMemory) {
			throw error(500, 'Failed to process memories');
		}

		return json(processedMemory);
	} catch (err) {
		console.error('Error processing memories:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to process memories');
	}
};
