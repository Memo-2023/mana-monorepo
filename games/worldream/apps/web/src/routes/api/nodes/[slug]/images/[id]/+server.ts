import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';

export const PATCH: RequestHandler = async (event) => {
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

	// Get the attachment and verify ownership through the node
	const { data: attachment, error: attachmentError } = await supabase
		.from('attachments')
		.select(
			`
			*,
			node:content_nodes!inner(owner_id, slug)
		`
		)
		.eq('id', params.id)
		.eq('kind', 'image')
		.single();

	if (attachmentError || !attachment) {
		return json({ error: 'Image not found' }, { status: 404 });
	}

	if (attachment.node.owner_id !== user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// Update the attachment
	const updates: any = {};
	if (body.is_primary !== undefined) updates.is_primary = body.is_primary;
	if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

	const { data: updatedAttachment, error } = await supabase
		.from('attachments')
		.update(updates)
		.eq('id', params.id)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	// Transform to expected image format
	const updatedImage = {
		id: updatedAttachment.id,
		image_url: updatedAttachment.url,
		prompt: updatedAttachment.generation_prompt,
		is_primary: updatedAttachment.is_primary,
		sort_order: updatedAttachment.sort_order,
		created_at: updatedAttachment.created_at,
	};

	return json(updatedImage);
};

export const DELETE: RequestHandler = async (event) => {
	const { params } = event;
	const supabase = createClient(event);

	// Verify user is authenticated
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Get the attachment and verify ownership through the node
	const { data: attachment, error: attachmentError } = await supabase
		.from('attachments')
		.select(
			`
			*,
			node:content_nodes!inner(owner_id)
		`
		)
		.eq('id', params.id)
		.eq('kind', 'image')
		.single();

	if (attachmentError || !attachment) {
		return json({ error: 'Image not found' }, { status: 404 });
	}

	if (attachment.node.owner_id !== user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// Delete the attachment
	const { error } = await supabase.from('attachments').delete().eq('id', params.id);

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	// If this was the primary image, make the next image primary
	if (attachment.is_primary) {
		const { data: nextAttachment } = await supabase
			.from('attachments')
			.select('id')
			.eq('node_slug', attachment.node_slug)
			.eq('kind', 'image')
			.order('sort_order')
			.order('created_at')
			.limit(1)
			.single();

		if (nextAttachment) {
			await supabase.from('attachments').update({ is_primary: true }).eq('id', nextAttachment.id);
		}
	}

	return json({ success: true });
};
