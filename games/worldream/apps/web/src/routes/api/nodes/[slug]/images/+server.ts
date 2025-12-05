import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';

export const GET: RequestHandler = async (event) => {
	const { params } = event;
	const supabase = createClient(event);

	// Get all image attachments for this node
	const { data: attachments, error } = await supabase
		.from('attachments')
		.select('*')
		.eq('node_slug', params.slug)
		.eq('kind', 'image')
		.order('is_primary', { ascending: false })
		.order('sort_order')
		.order('created_at', { ascending: false });

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	// Transform attachments to expected image format
	const images = (attachments || []).map((attachment) => ({
		id: attachment.id,
		image_url: attachment.url,
		prompt: attachment.generation_prompt,
		is_primary: attachment.is_primary,
		sort_order: attachment.sort_order,
		created_at: attachment.created_at,
	}));

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

	// Verify node exists and user owns it
	const { data: node, error: nodeError } = await supabase
		.from('content_nodes')
		.select('id, owner_id')
		.eq('slug', params.slug)
		.single();

	if (nodeError || !node) {
		console.error('Node lookup error:', nodeError, 'Params:', params);
		return json({ error: 'Node not found', details: nodeError?.message }, { status: 404 });
	}

	if (node.owner_id !== user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// Check if this should be the primary image (first image or explicitly set)
	const { count } = await supabase
		.from('attachments')
		.select('*', { count: 'exact', head: true })
		.eq('node_slug', params.slug)
		.eq('kind', 'image');

	const isPrimary = body.is_primary !== undefined ? body.is_primary : count === 0;

	// Insert the new image attachment
	const { data: attachment, error } = await supabase
		.from('attachments')
		.insert({
			node_slug: params.slug,
			kind: 'image',
			url: body.image_url,
			generation_prompt: body.prompt,
			is_primary: isPrimary,
			sort_order: body.sort_order || count || 0,
		})
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	// Transform to expected image format
	const image = {
		id: attachment.id,
		image_url: attachment.url,
		prompt: attachment.generation_prompt,
		is_primary: attachment.is_primary,
		sort_order: attachment.sort_order,
		created_at: attachment.created_at,
	};

	return json(image, { status: 201 });
};
