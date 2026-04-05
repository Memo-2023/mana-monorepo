/**
 * Music module — Audio upload, presigned URLs, cover art
 * Renamed from Mukke.
 */

import { Hono } from 'hono';

const routes = new Hono();

// ─── Song Upload (presigned URL) ────────────────────────────

routes.post('/songs/upload', async (c) => {
	const userId = c.get('userId');
	const { filename } = await c.req.json();
	if (!filename) return c.json({ error: 'filename required' }, 400);

	const songId = crypto.randomUUID();
	const key = `users/${userId}/songs/${songId}/${filename}`;

	try {
		const { createMusicStorage } = await import('@manacore/shared-storage');
		const storage = createMusicStorage();
		const uploadUrl = await storage.getUploadUrl(key, { expiresIn: 3600 });

		return c.json({
			song: { id: songId, title: filename.replace(/\.[^/.]+$/, ''), storagePath: key },
			uploadUrl,
		});
	} catch {
		return c.json({ error: 'Failed to generate upload URL' }, 500);
	}
});

// ─── Download URL ───────────────────────────────────────────

routes.get('/songs/:id/download-url', async (c) => {
	const { storagePath } = c.req.query();
	if (!storagePath) return c.json({ error: 'storagePath required' }, 400);

	try {
		const { createMusicStorage } = await import('@manacore/shared-storage');
		const storage = createMusicStorage();
		const url = await storage.getDownloadUrl(storagePath, { expiresIn: 3600 });
		return c.json({ url });
	} catch {
		return c.json({ error: 'Failed to generate download URL' }, 500);
	}
});

// ─── Cover Art Upload (via mana-media) ─────────────────────

routes.post('/cover/upload', async (c) => {
	const userId = c.get('userId');
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;

	if (!file) return c.json({ error: 'No file' }, 400);
	if (file.size > 10 * 1024 * 1024) return c.json({ error: 'Max 10MB' }, 400);
	if (!file.type.startsWith('image/')) return c.json({ error: 'Must be an image' }, 400);

	try {
		const { uploadImageToMedia } = await import('../../lib/media');
		const buffer = await file.arrayBuffer();
		const result = await uploadImageToMedia(buffer, file.name, { app: 'music', userId });

		return c.json(
			{
				coverArtPath: result.id,
				coverUrl: result.urls.thumbnail || result.urls.original,
				mediaId: result.id,
			},
			201
		);
	} catch {
		return c.json({ error: 'Upload failed' }, 500);
	}
});

// ─── Cover Art URL ──────────────────────────────────────────

routes.get('/songs/:id/cover-url', async (c) => {
	const { coverArtPath } = c.req.query();
	if (!coverArtPath) return c.json({ url: null });

	try {
		const { createMusicStorage } = await import('@manacore/shared-storage');
		const storage = createMusicStorage();
		const url = await storage.getDownloadUrl(coverArtPath, { expiresIn: 3600 });
		return c.json({ url });
	} catch {
		return c.json({ url: null });
	}
});

// ─── Batch Cover URLs ───────────────────────────────────────

routes.post('/library/cover-urls', async (c) => {
	const { paths } = await c.req.json();
	if (!paths?.length) return c.json({ urls: {} });

	try {
		const { createMusicStorage } = await import('@manacore/shared-storage');
		const storage = createMusicStorage();
		const urls: Record<string, string> = {};

		for (const path of paths.slice(0, 50)) {
			try {
				urls[path] = await storage.getDownloadUrl(path, { expiresIn: 3600 });
			} catch {
				// Skip failed URLs
			}
		}

		return c.json({ urls });
	} catch {
		return c.json({ urls: {} });
	}
});

export { routes as musicRoutes };
