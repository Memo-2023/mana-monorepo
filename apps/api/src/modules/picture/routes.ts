/**
 * Picture module — AI image generation + upload
 * Ported from apps/picture/apps/server
 *
 * CRUD for images/boards/boardItems handled by mana-sync.
 * This module handles Replicate API, S3 uploads, and explore.
 */

import { Hono } from 'hono';
import { consumeCredits, validateCredits } from '@mana/shared-hono/credits';
import type { AuthVariables } from '@mana/shared-hono';

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || '';
const IMAGE_GEN_URL = process.env.MANA_IMAGE_GEN_URL || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Credit cost for OpenAI gpt-image-2 by quality. Reflects ~$0.006 / $0.053 / $0.211
// per 1024² image so users bear roughly linear cost (1 credit ≈ $0.008).
// Flux/local stays at the flat 10-credit legacy rate.
function creditsFor(model: string | undefined, quality: string | undefined): number {
	if (model?.startsWith('openai/')) {
		if (quality === 'low') return 3;
		if (quality === 'high') return 25;
		return 10; // medium / auto
	}
	return 10;
}

type OpenAiSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
function resolveOpenAiSize(width?: number, height?: number): OpenAiSize {
	if (!width || !height) return '1024x1024';
	const landscape = width > height;
	const portrait = height > width;
	if (landscape) return '1536x1024';
	if (portrait) return '1024x1536';
	return '1024x1024';
}

const routes = new Hono<{ Variables: AuthVariables }>();

// ─── AI Image Generation (server-only: Replicate/local/OpenAI) ─────

routes.post('/generate', async (c) => {
	const userId = c.get('userId');
	const { prompt, model, width, height, negativePrompt, steps, guidanceScale, quality, n } =
		await c.req.json();

	if (!prompt) return c.json({ error: 'prompt required' }, 400);

	// Batch count. OpenAI gpt-image-2 supports up to 8; we clamp to 4 to stay
	// well under Tier-1 IPM limits and cap credit exposure on accidental max-n.
	// Non-OpenAI paths ignore this (Replicate/local produce a single image).
	const batchCount = Math.max(1, Math.min(4, Number(n) || 1));
	const effectiveBatch = model?.startsWith('openai/') ? batchCount : 1;
	const cost = creditsFor(model, quality) * effectiveBatch;
	const validation = await validateCredits(userId, 'AI_IMAGE_GENERATION', cost);
	if (!validation.hasCredits) {
		return c.json({ error: 'Insufficient credits', required: cost }, 402);
	}

	try {
		const imageUrls: string[] = [];
		const imageBuffers: ArrayBuffer[] = [];

		if (model?.startsWith('openai/') && OPENAI_API_KEY) {
			// OpenAI gpt-image-2 — returns base64, not URL, supports n > 1
			const openaiModel = model.slice('openai/'.length) || 'gpt-image-2';
			const res = await fetch('https://api.openai.com/v1/images/generations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${OPENAI_API_KEY}`,
				},
				body: JSON.stringify({
					model: openaiModel,
					prompt,
					size: resolveOpenAiSize(width, height),
					quality: quality || 'medium',
					n: effectiveBatch,
				}),
			});
			if (!res.ok) {
				const detail = await res.text().catch(() => '');
				return c.json({ error: 'OpenAI image API failed', detail: detail.slice(0, 500) }, 502);
			}
			const data = (await res.json()) as { data?: Array<{ b64_json?: string }> };
			const blobs = (data.data ?? []).map((d) => d.b64_json).filter((b): b is string => !!b);
			if (blobs.length === 0) return c.json({ error: 'OpenAI returned no image data' }, 502);
			for (const b64 of blobs) {
				const binary = Buffer.from(b64, 'base64');
				imageBuffers.push(
					binary.buffer.slice(
						binary.byteOffset,
						binary.byteOffset + binary.byteLength
					) as ArrayBuffer
				);
			}
		} else if (model?.startsWith('local/') && IMAGE_GEN_URL) {
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
			const localUrl = data.image_url || data.url;
			if (localUrl) imageUrls.push(localUrl);
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

			const replicateUrl = Array.isArray(output) ? output[0] : output;
			if (replicateUrl) imageUrls.push(replicateUrl);
		} else {
			return c.json({ error: 'No image generation service configured' }, 503);
		}

		const producedCount = imageBuffers.length + imageUrls.length;
		if (producedCount === 0) return c.json({ error: 'Generation produced no image' }, 502);

		await consumeCredits(userId, 'AI_IMAGE_GENERATION', cost, `Image: ${prompt.slice(0, 50)}`);

		// Store each generated image in mana-media for dedup, thumbnails & Photos gallery.
		// OpenAI contributed pre-decoded buffers; Replicate/local contributed URLs to fetch.
		try {
			const { uploadImageToMedia } = await import('../../lib/media');
			const images: Array<{ imageUrl: string; mediaId: string; thumbnailUrl?: string }> = [];
			const ts = Date.now();
			let idx = 0;
			for (const buf of imageBuffers) {
				const media = await uploadImageToMedia(buf, `generated-${ts}-${idx}.png`, {
					app: 'picture',
					userId,
				});
				images.push({
					imageUrl: media.urls.original,
					mediaId: media.id,
					thumbnailUrl: media.urls.thumbnail,
				});
				idx++;
			}
			for (const url of imageUrls) {
				const imgRes = await fetch(url);
				const imgBuffer = await imgRes.arrayBuffer();
				const media = await uploadImageToMedia(imgBuffer, `generated-${ts}-${idx}.png`, {
					app: 'picture',
					userId,
				});
				images.push({
					imageUrl: media.urls.original,
					mediaId: media.id,
					thumbnailUrl: media.urls.thumbnail,
				});
				idx++;
			}

			return c.json({
				images,
				prompt,
				model: model || 'flux-schnell',
				// Back-compat: first image exposed at top level too.
				imageUrl: images[0]?.imageUrl,
				mediaId: images[0]?.mediaId,
				thumbnailUrl: images[0]?.thumbnailUrl,
			});
		} catch {
			// Fallback: return raw imageUrls if mana-media is unavailable. OpenAI's
			// base64-only path has no fallback URL — surface an error instead.
			if (imageUrls.length === 0) return c.json({ error: 'Media upload failed' }, 502);
			return c.json({
				images: imageUrls.map((u) => ({ imageUrl: u })),
				imageUrl: imageUrls[0],
				prompt,
				model: model || 'flux-schnell',
			});
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
