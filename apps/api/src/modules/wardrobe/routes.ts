/**
 * Wardrobe module — server endpoints.
 *
 * Thin wrapper around mana-media for garment photo uploads. Plan:
 * docs/plans/wardrobe-module.md M1. No logic beyond tagging uploads
 * as `app='wardrobe'` so a later `GET /api/v1/media?app=wardrobe&...`
 * query can enumerate a user's garment pool without scanning every
 * media reference.
 *
 * Try-on generation does NOT live here — it reuses the Picture
 * module's POST /api/v1/picture/generate-with-reference endpoint
 * with MAX_REFERENCE_IMAGES bumped to 8 so face + body + garments
 * fit into one call.
 */

import { Hono } from 'hono';
import type { AuthVariables } from '@mana/shared-hono';

const routes = new Hono<{ Variables: AuthVariables }>();

// Same 10MB cap as the other photo-upload endpoints (profile me-images,
// picture uploads). Phone-camera PNG/HEIC routinely comes in under 6MB.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

routes.post('/garments/upload', async (c) => {
	const userId = c.get('userId');
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;

	if (!file) return c.json({ error: 'No file' }, 400);
	if (file.size > MAX_UPLOAD_BYTES) return c.json({ error: 'Max 10MB' }, 400);

	try {
		const { uploadImageToMedia } = await import('../../lib/media');
		const buffer = await file.arrayBuffer();
		const result = await uploadImageToMedia(buffer, file.name, {
			app: 'wardrobe',
			userId,
		});

		return c.json(
			{
				mediaId: result.id,
				storagePath: result.id,
				publicUrl: result.urls.original,
				thumbnailUrl: result.urls.thumbnail,
			},
			201
		);
	} catch (_err) {
		return c.json({ error: 'Upload failed' }, 500);
	}
});

export { routes as wardrobeRoutes };
