/**
 * Picture module — AI image generation + upload
 * Ported from apps/picture/apps/server
 *
 * CRUD for images/boards/boardItems handled by mana-sync.
 * This module handles Replicate API, S3 uploads, and explore.
 */

import { Hono } from 'hono';
import { consumeCredits, validateCredits } from '@mana/shared-hono/credits';

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || '';
const IMAGE_GEN_URL = process.env.MANA_IMAGE_GEN_URL || '';

const routes = new Hono();

// ─── AI Image Generation (server-only: Replicate/local) ─────

routes.post('/generate', async (c) => {
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

		// Store generated image in mana-media for dedup, thumbnails & Photos gallery
		try {
			const { uploadImageToMedia } = await import('../../lib/media');
			const imgRes = await fetch(imageUrl);
			const imgBuffer = await imgRes.arrayBuffer();
			const media = await uploadImageToMedia(imgBuffer, `generated-${Date.now()}.png`, {
				app: 'picture',
				userId,
			});

			return c.json({
				imageUrl: media.urls.original,
				mediaId: media.id,
				thumbnailUrl: media.urls.thumbnail,
				prompt,
				model: model || 'flux-schnell',
			});
		} catch {
			// Fallback: return raw imageUrl if mana-media is unavailable
			return c.json({ imageUrl, prompt, model: model || 'flux-schnell' });
		}
	} catch (_err) {
		return c.json({ error: 'Generation failed' }, 500);
	}
});

// ─── Image Upload (server-only: S3) ─────────────────────────

routes.post('/upload', async (c) => {
	const userId = c.get('userId');
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;

	if (!file) return c.json({ error: 'No file' }, 400);
	if (file.size > 10 * 1024 * 1024) return c.json({ error: 'Max 10MB' }, 400);

	try {
		const { uploadImageToMedia } = await import('../../lib/media');
		const buffer = await file.arrayBuffer();
		const result = await uploadImageToMedia(buffer, file.name, { app: 'picture', userId });

		return c.json(
			{
				storagePath: result.id,
				publicUrl: result.urls.original,
				mediaId: result.id,
				thumbnailUrl: result.urls.thumbnail,
			},
			201
		);
	} catch (_err) {
		return c.json({ error: 'Upload failed' }, 500);
	}
});

export { routes as pictureRoutes };
