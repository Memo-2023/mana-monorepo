import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const supabase = locals.supabase;
	const { slug } = params;

	const { data, error } = await supabase
		.from('content_nodes')
		.select('*')
		.eq('slug', slug)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			return json({ error: 'Node not found' }, { status: 404 });
		}
		return json({ error: error.message }, { status: 500 });
	}

	return json(data);
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const { slug } = params;
	const updates = await request.json();

	// First, check if user owns this node
	const { data: existingNode } = await supabase
		.from('content_nodes')
		.select('owner_id')
		.eq('slug', slug)
		.single();

	if (!existingNode || existingNode.owner_id !== session.user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// Create revision before updating
	const { data: currentNode } = await supabase
		.from('content_nodes')
		.select('*')
		.eq('slug', slug)
		.single();

	if (currentNode) {
		await supabase.from('node_revisions').insert({
			node_id: currentNode.id,
			node_slug: slug,
			content_before: currentNode.content,
			content_after: updates.content || currentNode.content,
			edited_by: session.user.id,
		});
	}

	// Update the node
	const { data, error } = await supabase
		.from('content_nodes')
		.update(updates)
		.eq('slug', slug)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json(data);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const { slug } = params;
	const updates = await request.json();

	// Check ownership
	const { data: existingNode } = await supabase
		.from('content_nodes')
		.select('owner_id, slug')
		.eq('slug', slug)
		.single();

	if (!existingNode || existingNode.owner_id !== session.user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// Handle slug changes
	const newSlug = updates.slug || slug;
	const updateData = {
		...updates,
		updated_at: new Date().toISOString(),
	};

	const { data, error } = await supabase
		.from('content_nodes')
		.update(updateData)
		.eq('slug', slug)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json(data);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const { slug } = params;

	// Check ownership
	const { data: existingNode } = await supabase
		.from('content_nodes')
		.select('owner_id')
		.eq('slug', slug)
		.single();

	if (!existingNode || existingNode.owner_id !== session.user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const { error } = await supabase.from('content_nodes').delete().eq('slug', slug);

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return new Response(null, { status: 204 });
};
