/**
 * Picture Hono Server — AI image generation + upload
 *
 * CRUD for images/boards/boardItems handled by mana-sync.
 * This server handles Replicate API, S3 uploads, and explore.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, healthRoute, errorHandler, notFoundHandler } from '@manacore/shared-hono';
import { consumeCredits, validateCredits } from '@manacore/shared-hono/credits';

const PORT = parseInt(process.env.PORT || '3006', 10);
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || '';
const IMAGE_GEN_URL = process.env.MANA_IMAGE_GEN_URL || '';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const app = new Hono();

app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));
app.route('/health', healthRoute('picture-server'));
app.use('/api/*', authMiddleware());

// ─── AI Image Generation (server-only: Replicate/local) ─────

app.post('/api/v1/generate', async (c) => {
	const userId = c.get('userId');
	const { prompt, model, width, height, negativePrompt, steps, guidanceScale } = await c.req.json();

	if (!prompt) return c.json({ error: 'prompt required' }, 400);

	const cost = 10;
	const validation = await validateCredits(userId, 'AI_IMAGE_GENERATION', cost);
	if (!validation.hasCredits) {
		return c.json({ error: 'Insufficient credits', required: cost }, 402);
	}

	try {
		let imageUrl: string;

		if (model?.startsWith('local/') && IMAGE_GEN_URL) {
			// Local generation via mana-image-gen
			const res = await fetch(`${IMAGE_GEN_URL}/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					prompt,
					negative_prompt: negativePrompt,
					width: width || 1024,
					height: height || 1024,
					steps: steps || 20,
					guidance_scale: guidanceScale || 7.5,
				}),
			});
			if (!res.ok) return c.json({ error: 'Local generation failed' }, 502);
			const data = await res.json();
			imageUrl = data.image_url || data.url;
		} else if (REPLICATE_TOKEN) {
			// Cloud generation via Replicate
			const res = await fetch('https://api.replicate.com/v1/predictions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${REPLICATE_TOKEN}`,
				},
				body: JSON.stringify({
					model: model || 'black-forest-labs/flux-schnell',
					input: {
						prompt,
						negative_prompt: negativePrompt,
						width: width || 1024,
						height: height || 1024,
						num_inference_steps: steps || 4,
						guidance_scale: guidanceScale || 0,
					},
				}),
			});
			if (!res.ok) return c.json({ error: 'Replicate API failed' }, 502);

			const prediction = await res.json();

			// Poll for completion
			let output = prediction.output;
			if (!output && prediction.urls?.get) {
				for (let i = 0; i < 60; i++) {
					await new Promise((r) => setTimeout(r, 2000));
					const pollRes = await fetch(prediction.urls.get, {
						headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` },
					});
					const pollData = await pollRes.json();
					if (pollData.status === 'succeeded') {
						output = pollData.output;
						break;
					}
					if (pollData.status === 'failed') {
						return c.json({ error: 'Generation failed' }, 500);
					}
				}
			}

			imageUrl = Array.isArray(output) ? output[0] : output;
		} else {
			return c.json({ error: 'No image generation service configured' }, 503);
		}

		await consumeCredits(userId, 'AI_IMAGE_GENERATION', cost, `Image: ${prompt.slice(0, 50)}`);

		return c.json({ imageUrl, prompt, model: model || 'flux-schnell' });
	} catch (_err) {
		return c.json({ error: 'Generation failed' }, 500);
	}
});

// ─── Image Upload (server-only: S3) ─────────────────────────

app.post('/api/v1/upload', async (c) => {
	const userId = c.get('userId');
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;

	if (!file) return c.json({ error: 'No file' }, 400);
	if (file.size > 10 * 1024 * 1024) return c.json({ error: 'Max 10MB' }, 400);

	try {
		const { createPictureStorage, generateUserFileKey, getContentType } =
			await import('@manacore/shared-storage');
		const storage = createPictureStorage();
		const key = generateUserFileKey(userId, file.name);
		const buffer = Buffer.from(await file.arrayBuffer());

		const result = await storage.upload(key, buffer, {
			contentType: getContentType(file.name),
			public: true,
		});

		return c.json({ storagePath: key, publicUrl: result.url }, 201);
	} catch (_err) {
		return c.json({ error: 'Upload failed' }, 500);
	}
});

export default { port: PORT, fetch: app.fetch };
