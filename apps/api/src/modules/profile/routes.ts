/**
 * Profile module — server endpoints.
 *
 * Upload route for me-images (docs/plans/me-images-and-reference-generation.md M1).
 * Thin wrapper over mana-media — the stored row lands in Dexie on the
 * client after this returns. We keep server-side storage of the image
 * in mana-media (CAS + thumbnails) so the Picture generator can pull
 * the original bytes by `mediaId` for the eventual /v1/images/edits
 * call (M3) without the client needing to re-upload each time.
 */

import { Hono } from 'hono';
import type { AuthVariables } from '@mana/shared-hono';

const routes = new Hono<{ Variables: AuthVariables }>();

// Max upload size for me-images. 10MB matches /picture/upload — same
// real-world phone-camera PNG range, same mana-media pipeline downstream.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

routes.post('/me-images/upload', async (c) => {
	const userId = c.get('userId');
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;

	if (!file) return c.json({ error: 'No file' }, 400);
	if (file.size > MAX_UPLOAD_BYTES) return c.json({ error: 'Max 10MB' }, 400);

	try {
		const { uploadImageToMedia } = await import('../../lib/media');
		const buffer = await file.arrayBuffer();
		// `app='me'` tags the media_references row so a later
		// GET /api/v1/media?app=me&userId=X can list all me-images,
		// and the /v1/images/edits path can verify ownership in O(1).
		const result = await uploadImageToMedia(buffer, file.name, {
			app: 'me',
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

export { routes as profileRoutes };
