import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MemoryService } from '$lib/services/memoryService';
import { createClient } from '$lib/supabase/server';

// GET /api/nodes/[slug]/memory - Get node memory
export const GET: RequestHandler = async (event) => {
	const { params, locals } = event;
	const { slug } = params;
	const supabase = createClient(event);

	try {
		// Get authenticated user
		const { user } = await locals.safeGetSession();
		if (!user) {
			throw error(401, 'Unauthorized');
		}

		// Get the node to verify ownership
		const { data: node, error: nodeError } = await supabase
			.from('content_nodes')
			.select('id, owner_id')
			.eq('slug', slug)
			.single();

		if (nodeError || !node) {
			throw error(404, 'Node not found');
		}

		// Check if user has access
		if (node.owner_id !== user.id) {
			throw error(403, "You do not have access to this node's memory");
		}

		const memory = await MemoryService.getMemory(node.id);
		return json(memory);
	} catch (err) {
		console.error('Error fetching memory:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to fetch memory');
	}
};

// POST /api/nodes/[slug]/memory - Add a new memory
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
			throw error(403, 'You do not have permission to modify this node');
		}

		const body = await request.json();
		const {
			content,
			tier = 'short',
			importance = 5,
			tags = [],
			involved = [],
			location,
			emotional_weight,
		} = body;

		if (!content) {
			throw error(400, 'Memory content is required');
		}

		const success = await MemoryService.addMemory(node.id, content, tier, {
			importance,
			tags,
			involved,
			location,
			emotional_weight,
		});

		if (!success) {
			throw error(500, 'Failed to add memory');
		}

		return json({ success: true });
	} catch (err) {
		console.error('Error adding memory:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to add memory');
	}
};

// PUT /api/nodes/[slug]/memory - Update entire memory object
export const PUT: RequestHandler = async (event) => {
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
			throw error(403, 'You do not have permission to modify this node');
		}

		const memory = await request.json();
		const success = await MemoryService.updateMemory(node.id, memory);

		if (!success) {
			throw error(500, 'Failed to update memory');
		}

		return json({ success: true });
	} catch (err) {
		console.error('Error updating memory:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to update memory');
	}
};
