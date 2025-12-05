import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';
import { createId } from '@paralleldrive/cuid2';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const POST: RequestHandler = async (event) => {
	const { request, params } = event;
	const supabase = createClient(event);
	const nodeSlug = params.slug;

	// Verify user is authenticated
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Get the node to verify ownership
		const { data: node, error: nodeError } = await supabase
			.from('content_nodes')
			.select('id, owner_id')
			.eq('slug', nodeSlug)
			.single();

		if (nodeError || !node) {
			throw error(404, 'Node not found');
		}

		// Check ownership
		if (node.owner_id !== user.id) {
			throw error(403, 'Not authorized to upload images to this node');
		}

		// Parse multipart form data
		const formData = await request.formData();
		const imageFile = formData.get('image') as File;
		const isPrimary = formData.get('is_primary') === 'true';

		if (!imageFile) {
			throw error(400, 'No image file provided');
		}

		// Validate file type
		if (!ALLOWED_TYPES.includes(imageFile.type)) {
			throw error(400, 'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed');
		}

		// Validate file size
		if (imageFile.size > MAX_FILE_SIZE) {
			throw error(400, 'File too large. Maximum size is 10MB');
		}

		// Generate unique filename
		const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
		const fileName = `${nodeSlug}/${createId()}.${fileExt}`;

		// Upload to Supabase Storage
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from('node-images')
			.upload(fileName, imageFile, {
				contentType: imageFile.type,
				cacheControl: '3600',
				upsert: false,
			});

		if (uploadError) {
			console.error('Storage upload error:', uploadError);
			throw error(500, 'Failed to upload image');
		}

		// Get public URL
		const {
			data: { publicUrl },
		} = supabase.storage.from('node-images').getPublicUrl(fileName);

		// If this should be primary, unset other primary images first
		if (isPrimary) {
			await supabase
				.from('attachments')
				.update({ is_primary: false })
				.eq('node_slug', nodeSlug)
				.eq('kind', 'image');
		}

		// Check if there are any existing images
		const { count } = await supabase
			.from('attachments')
			.select('*', { count: 'exact', head: true })
			.eq('node_slug', nodeSlug)
			.eq('kind', 'image');

		// Create attachment record
		const { data: attachment, error: attachmentError } = await supabase
			.from('attachments')
			.insert({
				node_slug: nodeSlug,
				kind: 'image',
				file_url: publicUrl,
				storage_path: fileName,
				metadata: {
					original_name: imageFile.name,
					size: imageFile.size,
					type: imageFile.type,
				},
				is_primary: isPrimary || count === 0, // Set as primary if requested or if it's the first image
				sort_order: (count || 0) + 1,
			})
			.select()
			.single();

		if (attachmentError) {
			// Try to clean up the uploaded file
			await supabase.storage.from('node-images').remove([fileName]);
			console.error('Attachment creation error:', attachmentError);
			throw error(500, 'Failed to create attachment record');
		}

		// Dispatch event to update UI
		if (typeof window !== 'undefined') {
			window.dispatchEvent(
				new CustomEvent('images-updated', {
					detail: { nodeSlug },
				})
			);
		}

		return json({
			id: attachment.id,
			image_url: publicUrl,
			is_primary: attachment.is_primary,
			sort_order: attachment.sort_order,
			created_at: attachment.created_at,
		});
	} catch (err) {
		console.error('Upload error:', err);
		if (err instanceof Response) {
			throw err;
		}
		throw error(500, 'Internal server error');
	}
};
