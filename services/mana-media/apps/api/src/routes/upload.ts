import { Hono } from 'hono';
import type { UploadService, MediaRecord } from '../services/upload';
import { sniffImageMimeType } from '../services/sniff';

function toResponse(record: MediaRecord) {
	const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3015/api/v1';
	return {
		id: record.id,
		status: record.status,
		originalName: record.originalName,
		mimeType: record.mimeType,
		size: record.size,
		hash: record.hash,
		urls: {
			original: `${baseUrl}/media/${record.id}/file`,
			thumbnail: record.keys.thumbnail ? `${baseUrl}/media/${record.id}/file/thumb` : undefined,
			medium: record.keys.medium ? `${baseUrl}/media/${record.id}/file/medium` : undefined,
			large: record.keys.large ? `${baseUrl}/media/${record.id}/file/large` : undefined,
		},
		metadata: record.metadata,
		exif: record.exif,
		createdAt: record.createdAt,
	};
}

export function uploadRoutes(uploadService: UploadService) {
	const app = new Hono();

	// Upload file
	app.post('/upload', async (c) => {
		const body = await c.req.parseBody();
		const file = body['file'];

		if (!file || !(file instanceof File)) {
			return c.json({ error: 'No file provided' }, 400);
		}

		if (file.size > 100 * 1024 * 1024) {
			return c.json({ error: 'File too large (max 100MB)' }, 400);
		}

		let buffer = Buffer.from(await file.arrayBuffer());

		// Magic-byte sniff first; trust the bytes over the browser's
		// `file.type`. Chrome on macOS doesn't recognise HEIC and sends
		// an empty type, which would otherwise land as
		// `application/octet-stream` and break every downstream
		// `mimeType.startsWith('image/')` check (transform endpoint,
		// process pipeline, etc). A successful sniff returns an
		// authoritative image MIME; anything we don't recognise falls
		// back to whatever the browser claimed.
		const sniffed = sniffImageMimeType(buffer);
		let mimeType = sniffed ?? file.type ?? 'application/octet-stream';
		let storedName = file.name;
		let storedSize = file.size;

		// HEIC/HEIF transcode. The sharp version we ship has the heif
		// container format but no HEVC decoder plugin (libde265 is not
		// bundled in sharp's prebuilt binaries due to patent licensing),
		// so iPhone HEIC uploads would fail every downstream sharp
		// transform with `No decoding plugin installed for this
		// compression format`. Convert to JPEG once at upload time via
		// `heic-convert` (pure-JS WASM, no system deps); the server then
		// stores standard JPEG and every later step is mime-agnostic.
		if (mimeType === 'image/heic' || mimeType === 'image/heif') {
			try {
				const heicConvert = (await import('heic-convert')).default;
				const jpegArrayBuffer = await heicConvert({
					// `Buffer` extends `Uint8Array` and is what heic-convert
					// actually accepts at runtime. `@types/heic-convert`
					// over-tightens the param to `ArrayBufferLike` (which
					// in TS ≥ 5.7 includes the `grow` property only on
					// `SharedArrayBuffer`), so a normal Buffer doesn't
					// match the declared type. Cast through `unknown` to
					// avoid lying about a wider intersection.
					buffer: buffer as unknown as ArrayBufferLike,
					format: 'JPEG',
					quality: 0.9,
				});
				buffer = Buffer.from(jpegArrayBuffer);
				mimeType = 'image/jpeg';
				storedName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
				storedSize = buffer.length;
			} catch (err) {
				console.error('[upload] HEIC convert failed', err);
				return c.json({ error: 'HEIC conversion failed', detail: (err as Error).message }, 500);
			}
		}

		const record = await uploadService.upload(buffer, storedName, mimeType, storedSize, {
			app: body['app'] as string | undefined,
			userId: body['userId'] as string | undefined,
			skipProcessing: body['skipProcessing'] === 'true',
		});

		return c.json(toResponse(record), 201);
	});

	// Get by ID
	app.get('/:id', async (c) => {
		const id = c.req.param('id');

		// Skip route conflicts with sub-paths
		if (['hash', 'list', 'stats'].includes(id)) return;

		const record = await uploadService.get(id);
		if (!record) return c.json({ error: 'Media not found' }, 404);
		return c.json(toResponse(record));
	});

	// Get by hash
	app.get('/hash/:hash', async (c) => {
		const record = await uploadService.getByHash(c.req.param('hash'));
		if (!record) return c.json({ error: 'Media not found' }, 404);
		return c.json(toResponse(record));
	});

	// List
	app.get('/', async (c) => {
		const records = await uploadService.list({
			app: c.req.query('app'),
			userId: c.req.query('userId'),
			limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50,
		});
		return c.json(records.map(toResponse));
	});

	// List all with advanced filtering
	app.get('/list/all', async (c) => {
		const userId = c.req.query('userId');
		if (!userId) return c.json({ error: 'userId is required' }, 400);

		const apps = c.req.query('apps');
		const result = await uploadService.listAll({
			userId,
			apps: apps ? apps.split(',').map((a) => a.trim()) : undefined,
			mimeType: c.req.query('mimeType'),
			dateFrom: c.req.query('dateFrom') ? new Date(c.req.query('dateFrom')!) : undefined,
			dateTo: c.req.query('dateTo') ? new Date(c.req.query('dateTo')!) : undefined,
			hasLocation: c.req.query('hasLocation') === 'true',
			limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50,
			offset: c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0,
			sortBy: (c.req.query('sortBy') as 'createdAt' | 'dateTaken' | 'size') || 'createdAt',
			sortOrder: (c.req.query('sortOrder') as 'asc' | 'desc') || 'desc',
		});

		return c.json({
			items: result.items.map(toResponse),
			total: result.total,
			hasMore: result.hasMore,
		});
	});

	// Stats
	app.get('/stats', async (c) => {
		const userId = c.req.query('userId');
		if (!userId) return c.json({ error: 'userId is required' }, 400);
		return c.json(await uploadService.getStats(userId));
	});

	// Delete
	app.delete('/:id', async (c) => {
		const deleted = await uploadService.delete(c.req.param('id'));
		if (!deleted) return c.json({ error: 'Media not found' }, 404);
		return c.json({ success: true });
	});

	return app;
}
