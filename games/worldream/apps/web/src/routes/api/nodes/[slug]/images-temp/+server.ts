import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';

// Temporary endpoint that works without node_images table
// Until migration can be run with Docker/Supabase

export const GET: RequestHandler = async (event) => {
	const { params } = event;
	const supabase = createClient(event);

	// Get the node - if it has an image_url, return it as primary image
	const { data: node, error: nodeError } = await supabase
		.from('content_nodes')
		.select('image_url, generation_prompt')
		.eq('slug', params.slug)
		.single();

	if (nodeError || !node) {
		return json({ error: 'Node not found' }, { status: 404 });
	}

	// Convert existing image to new format
	const images = [];
	if (node.image_url) {
		images.push({
			id: 'temp-primary',
			image_url: node.image_url,
			prompt: node.generation_prompt,
			is_primary: true,
			sort_order: 0,
			created_at: new Date().toISOString(),
		});
	}

	return json(images);
};

export const POST: RequestHandler = async (event) => {
	const { params, request } = event;
	const supabase = createClient(event);
	const body = await request.json();

	// Verify user is authenticated
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Get the node and verify ownership
	const { data: node, error: nodeError } = await supabase
		.from('content_nodes')
		.select('id, owner_id, image_url, slug, title')
		.eq('slug', params.slug)
		.single();

	if (nodeError || !node) {
		console.error('Node lookup error for slug:', params.slug, 'Error:', nodeError);
		console.error('Full params:', params);

		// Try to find similar nodes for debugging
		const { data: similarNodes } = await supabase
			.from('content_nodes')
			.select('slug, title')
			.ilike('slug', `%${params.slug}%`)
			.limit(5);

		console.error('Similar nodes found:', similarNodes);

		return json(
			{
				error: 'Node not found',
				details: nodeError?.message,
				searchedSlug: params.slug,
				similarNodes: similarNodes,
			},
			{ status: 404 }
		);
	}

	if (node.owner_id !== user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// For now, just update the main image_url field
	// This is temporary until the migration can be run
	const { data: updatedNode, error: updateError } = await supabase
		.from('content_nodes')
		.update({
			image_url: body.image_url,
			generation_prompt: body.prompt,
		})
		.eq('id', node.id)
		.select()
		.single();

	if (updateError) {
		return json({ error: updateError.message }, { status: 500 });
	}

	// Return in the expected format
	const imageRecord = {
		id: 'temp-new',
		image_url: body.image_url,
		prompt: body.prompt,
		is_primary: true,
		sort_order: 0,
		created_at: new Date().toISOString(),
		node_id: node.id,
	};

	return json(imageRecord, { status: 201 });
};
