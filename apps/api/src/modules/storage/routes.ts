/**
 * Storage module — File upload/download via S3
 * Ported from apps/storage/apps/server
 *
 * Metadata CRUD for files/folders handled by mana-sync.
 * This module handles S3 operations (upload, download, presigned URLs).
 */

import { Hono } from 'hono';

const routes = new Hono();

// ─── File Upload (server-only: S3) ──────────────────────────

routes.post('/files/upload', async (c) => {
	const userId = c.get('userId');
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;
	const folderId = formData.get('folderId') as string | null;

	if (!file) return c.json({ error: 'No file' }, 400);
	if (file.size > 100 * 1024 * 1024) return c.json({ error: 'Max 100MB' }, 400);

	try {
		const buffer = await file.arrayBuffer();
		const { isImageMimeType } = await import('../../lib/media');

		// Images -> mana-media for dedup, thumbnails & Photos gallery
		if (isImageMimeType(file.type)) {
			const { uploadImageToMedia } = await import('../../lib/media');
			const result = await uploadImageToMedia(buffer, file.name, { app: 'storage', userId });

			return c.json(
				{
					id: crypto.randomUUID(),
					name: file.name,
					storagePath: result.id,
					storageKey: result.id,
					mimeType: file.type,
					size: file.size,
					parentFolderId: folderId,
					mediaId: result.id,
				},
				201
			);
		}

		// Non-images -> shared-storage as before
		const { createStorageStorage, generateUserFileKey, getContentType } = await import(
			'@manacore/shared-storage'
		);
		const storage = createStorageStorage();
		const key = generateUserFileKey(userId, file.name);

		await storage.upload(key, Buffer.from(buffer), {
			contentType: getContentType(file.name),
			public: false,
		});

		return c.json(
			{
				id: crypto.randomUUID(),
				name: file.name,
				storagePath: key,
				storageKey: key,
				mimeType: file.type,
				size: file.size,
				parentFolderId: folderId,
			},
			201
		);
	} catch (_err) {
		return c.json({ error: 'Upload failed' }, 500);
	}
});

// ─── File Download (server-only: S3 presigned URL) ──────────

routes.get('/files/:id/download', async (c) => {
	const storagePath = c.req.query('storagePath');
	const urlOnly = c.req.query('url') === 'true';

	if (!storagePath) return c.json({ error: 'storagePath required' }, 400);

	try {
		const { createStorageStorage } = await import('@manacore/shared-storage');
		const storage = createStorageStorage();

		if (urlOnly) {
			const url = await storage.getDownloadUrl(storagePath, { expiresIn: 3600 });
			return c.json({ url });
		}

		const data = await storage.download(storagePath);
		return new Response(data.body, {
			headers: {
				'Content-Type': data.contentType || 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${storagePath.split('/').pop()}"`,
			},
		});
	} catch (_err) {
		return c.json({ error: 'Download failed' }, 500);
	}
});

// ─── Version Upload ─────────────────────────────────────────

routes.post('/files/:id/versions', async (c) => {
	const userId = c.get('userId');
	const fileId = c.req.param('id');
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;

	if (!file) return c.json({ error: 'No file' }, 400);

	try {
		const { createStorageStorage, generateUserFileKey } = await import('@manacore/shared-storage');
		const storage = createStorageStorage();
		const key = generateUserFileKey(userId, `v-${Date.now()}-${file.name}`);
		const buffer = Buffer.from(await file.arrayBuffer());

		await storage.upload(key, buffer, { contentType: file.type });

		return c.json({ fileId, storagePath: key, size: file.size }, 201);
	} catch (_err) {
		return c.json({ error: 'Version upload failed' }, 500);
	}
});

export { routes as storageRoutes };
