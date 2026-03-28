/**
 * Mukke Hono Server — Audio upload, metadata, presigned URLs
 *
 * CRUD for songs/playlists/projects handled by mana-sync.
 * This server handles S3 operations and metadata extraction.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, healthRoute, errorHandler, notFoundHandler } from '@manacore/shared-hono';

const PORT = parseInt(process.env.PORT || '3010', 10);
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_BUCKET = process.env.S3_BUCKET || 'mukke-storage';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5180').split(',');

const app = new Hono();

app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));
app.route('/health', healthRoute('mukke-server'));
app.use('/api/*', authMiddleware());

// ─── Song Upload (server-only: S3 presigned URL) ────────────

app.post('/api/v1/songs/upload', async (c) => {
	const userId = c.get('userId');
	const { filename } = await c.req.json();

	if (!filename) return c.json({ error: 'filename required' }, 400);

	const songId = crypto.randomUUID();
	const key = `users/${userId}/songs/${songId}/${filename}`;

	// Generate presigned upload URL
	try {
		const { createMukkeStorage, generateUserFileKey } = await import('@manacore/shared-storage');
		const storage = createMukkeStorage();
		const uploadUrl = await storage.getUploadUrl(key, { expiresIn: 3600 });

		return c.json({
			song: { id: songId, title: filename.replace(/\.[^/.]+$/, ''), storagePath: key },
			uploadUrl,
		});
	} catch (_err) {
		return c.json({ error: 'Failed to generate upload URL' }, 500);
	}
});

// ─── Download URL (server-only: S3 presigned URL) ────────────

app.get('/api/v1/songs/:id/download-url', async (c) => {
	const { storagePath } = c.req.query();
	if (!storagePath) return c.json({ error: 'storagePath required' }, 400);

	try {
		const { createMukkeStorage } = await import('@manacore/shared-storage');
		const storage = createMukkeStorage();
		const url = await storage.getDownloadUrl(storagePath, { expiresIn: 3600 });
		return c.json({ url });
	} catch (_err) {
		return c.json({ error: 'Failed to generate download URL' }, 500);
	}
});

// ─── Cover Art URL (server-only: S3 presigned URL) ───────────

app.get('/api/v1/songs/:id/cover-url', async (c) => {
	const { coverArtPath } = c.req.query();
	if (!coverArtPath) return c.json({ url: null });

	try {
		const { createMukkeStorage } = await import('@manacore/shared-storage');
		const storage = createMukkeStorage();
		const url = await storage.getDownloadUrl(coverArtPath, { expiresIn: 3600 });
		return c.json({ url });
	} catch (_err) {
		return c.json({ url: null });
	}
});

// ─── Batch Cover URLs ────────────────────────────────────────

app.post('/api/v1/library/cover-urls', async (c) => {
	const { paths } = await c.req.json();
	if (!paths?.length) return c.json({ urls: {} });

	try {
		const { createMukkeStorage } = await import('@manacore/shared-storage');
		const storage = createMukkeStorage();
		const urls: Record<string, string> = {};

		for (const path of paths.slice(0, 50)) {
			try {
				urls[path] = await storage.getDownloadUrl(path, { expiresIn: 3600 });
			} catch {
				// Skip failed URLs
			}
		}

		return c.json({ urls });
	} catch (_err) {
		return c.json({ urls: {} });
	}
});

export default { port: PORT, fetch: app.fetch };
