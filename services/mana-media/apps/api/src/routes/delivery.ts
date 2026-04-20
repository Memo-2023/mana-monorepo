import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import type { UploadService } from '../services/upload';
import type { ProcessService } from '../services/process';
import type { StorageService } from '../services/storage';

type Variant = 'thumb' | 'medium' | 'large';

export function deliveryRoutes(
	uploadService: UploadService,
	processService: ProcessService,
	storage: StorageService
) {
	const app = new Hono();

	// Get original file
	app.get('/:id/file', async (c) => {
		const record = await uploadService.get(c.req.param('id'));
		if (!record) return c.json({ error: 'Media not found' }, 404);

		return streamFile(c, storage, record.keys.original, record.mimeType);
	});

	// Get variant
	app.get('/:id/file/:variant', async (c) => {
		const record = await uploadService.get(c.req.param('id'));
		if (!record) return c.json({ error: 'Media not found' }, 404);

		const variant = c.req.param('variant') as Variant;
		const variantMap: Record<Variant, string | undefined> = {
			thumb: record.keys.thumbnail,
			medium: record.keys.medium,
			large: record.keys.large,
		};

		const key = variantMap[variant];
		if (!key) {
			return streamFile(c, storage, record.keys.original, record.mimeType);
		}

		return streamFile(c, storage, key, 'image/webp');
	});

	// On-the-fly transform
	app.get('/:id/transform', async (c) => {
		const record = await uploadService.get(c.req.param('id'));
		if (!record) return c.json({ error: 'Media not found' }, 404);

		if (!record.mimeType.startsWith('image/')) {
			return c.json({ error: 'Transform only supported for images' }, 400);
		}

		const originalBuffer = await storage.download(record.keys.original);
		const format = (c.req.query('format') as 'webp' | 'jpeg' | 'png' | 'avif') || 'webp';

		const transformedBuffer = await processService.transformImage(originalBuffer, {
			width: c.req.query('w') ? parseInt(c.req.query('w')!) : undefined,
			height: c.req.query('h') ? parseInt(c.req.query('h')!) : undefined,
			fit: (c.req.query('fit') as 'cover' | 'contain' | 'fill' | 'inside' | 'outside') || 'inside',
			format,
			quality: c.req.query('q') ? parseInt(c.req.query('q')!) : 85,
		});

		const mimeTypes: Record<string, string> = {
			webp: 'image/webp',
			jpeg: 'image/jpeg',
			png: 'image/png',
			avif: 'image/avif',
		};

		c.header('Content-Type', mimeTypes[format]);
		c.header('Cache-Control', 'public, max-age=31536000');
		// Hono 4.7 types `c.body()` as `Uint8Array<ArrayBuffer>` (strict,
		// not ArrayBufferLike). Node's `Buffer<ArrayBufferLike>` and
		// `new Uint8Array(buffer, ...)` views both carry the loose
		// ArrayBufferLike tag. `Uint8Array.from()` copies into a fresh
		// ArrayBuffer which satisfies the strict type.
		return c.body(Uint8Array.from(transformedBuffer));
	});

	return app;
}

async function streamFile(c: any, storage: StorageService, key: string, contentType: string) {
	try {
		const fileStream = await storage.getStream(key);

		c.header('Content-Type', contentType);
		c.header('Cache-Control', 'public, max-age=31536000');

		return stream(c, async (s) => {
			for await (const chunk of fileStream) {
				await s.write(chunk);
			}
		});
	} catch {
		return c.json({ error: 'File not found' }, 404);
	}
}
