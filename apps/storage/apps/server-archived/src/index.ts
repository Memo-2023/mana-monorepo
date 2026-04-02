/**
 * Storage Hono Server — File upload/download via S3
 *
 * Metadata CRUD for files/folders handled by mana-sync.
 * This server handles S3 operations (upload, download, presigned URLs).
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, healthRoute, errorHandler, notFoundHandler } from '@manacore/shared-hono';

const PORT = parseInt(process.env.PORT || '3016', 10);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5185').split(',');

const app = new Hono();

app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));
app.route('/health', healthRoute('storage-server'));
app.use('/api/*', authMiddleware());

// ─── File Upload (server-only: S3) ──────────────────────────

app.post('/api/v1/files/upload', async (c) => {
	const userId = c.get('userId');
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;
	const folderId = formData.get('folderId') as string | null;

	if (!file) return c.json({ error: 'No file' }, 400);
	if (file.size > 100 * 1024 * 1024) return c.json({ error: 'Max 100MB' }, 400);

	try {
		const { createStorageStorage, generateUserFileKey, getContentType } = await import(
			'@manacore/shared-storage'
		);
		const storage = createStorageStorage();
		const key = generateUserFileKey(userId, file.name);
		const buffer = Buffer.from(await file.arrayBuffer());

		await storage.upload(key, buffer, {
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

app.get('/api/v1/files/:id/download', async (c) => {
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

app.post('/api/v1/files/:id/versions', async (c) => {
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

export default { port: PORT, fetch: app.fetch };
