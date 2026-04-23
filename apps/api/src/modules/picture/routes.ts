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

// ─── Reference-based Image Edits (OpenAI /v1/images/edits) ─────────
//
// Takes 1..MAX_REFERENCE_IMAGES media ids from the caller (expected to
// come from meImages — plan M1, filtered by usage.aiReference=true on
// the client), verifies ownership under the `me` app-tag, downloads the
// raw bytes from mana-media, and forwards a multipart POST to OpenAI's
// `/v1/images/edits`. Generated outputs are pushed back into mana-media
// under app='picture' so the Dexie picture-store can pin them exactly
// like a text-to-image result.
//
// Only gpt-image-1 / gpt-image-2 are wired here — they accept multi-
// image input natively. Replicate/local fallback is a later milestone.

// OpenAI gpt-image-1 / gpt-image-2 accept up to 16 reference images per
// edit call. We clamp at 8 to cover the Wardrobe try-on workflow — one
// face-ref + one body-ref + up to six garment photos (top/bottom/shoes/
// outerwear + two accessories) — while keeping credit exposure and
// upload payload size predictable. Pre-wardrobe the cap was 4; bumped
// in docs/plans/wardrobe-module.md M1.
const MAX_REFERENCE_IMAGES = 8;

routes.post('/generate-with-reference', async (c) => {
	const userId = c.get('userId');
	const body = (await c.req.json()) as {
		prompt?: string;
		referenceMediaIds?: string[];
		model?: string;
		quality?: string;
		size?: OpenAiSize;
		n?: number;
	};

	const prompt = (body.prompt ?? '').trim();
	if (!prompt) return c.json({ error: 'prompt required' }, 400);

	const refIds = Array.isArray(body.referenceMediaIds)
		? body.referenceMediaIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
		: [];
	if (refIds.length === 0) return c.json({ error: 'referenceMediaIds required' }, 400);
	if (refIds.length > MAX_REFERENCE_IMAGES) {
		return c.json(
			{ error: `Too many references (max ${MAX_REFERENCE_IMAGES})`, limit: MAX_REFERENCE_IMAGES },
			400
		);
	}

	if (!OPENAI_API_KEY) {
		return c.json({ error: 'OpenAI image edits not configured' }, 503);
	}

	const model = body.model ?? 'openai/gpt-image-2';
	if (!model.startsWith('openai/')) {
		// Edits routing for non-OpenAI backends (local FLUX+PuLID, Replicate)
		// is future work — plan M5. Fail loud rather than silently downgrading.
		return c.json({ error: `Model ${model} not supported for edits`, model }, 400);
	}
	const openaiModel = model.slice('openai/'.length) || 'gpt-image-2';
	const quality = (body.quality as 'low' | 'medium' | 'high' | undefined) ?? 'medium';
	const size: OpenAiSize = body.size ?? '1024x1024';
	const effectiveBatch = Math.max(1, Math.min(4, Number(body.n) || 1));

	// Credits: same per-output tarif as /generate. References don't add
	// a surcharge — OpenAI doesn't bill extra for input images, so we
	// don't either (plan decision #4).
	const cost = creditsFor(model, quality) * effectiveBatch;
	const validation = await validateCredits(userId, 'AI_IMAGE_GENERATION', cost);
	if (!validation.hasCredits) {
		return c.json({ error: 'Insufficient credits', required: cost }, 402);
	}

	// Ownership check before we spend credits or burn OpenAI quota.
	// References span two upload tags: `me` for face/body portraits
	// (profile module) and `wardrobe` for garment photos (wardrobe
	// module, M4 try-on flow). Anything outside those two apps is
	// treated as not-owned regardless of mana-media's own view.
	try {
		const { verifyMediaOwnership } = await import('../../lib/media');
		await verifyMediaOwnership(userId, refIds, ['me', 'wardrobe']);
	} catch (err) {
		const e = err as Error & { status?: number; missing?: string[] };
		if (e.status === 404) {
			return c.json({ error: 'Reference media not found', missing: e.missing }, 404);
		}
		console.error('[picture/generate-with-reference] ownership check failed', {
			userId,
			refIds,
			error: e.message,
		});
		return c.json({ error: 'Ownership check failed', detail: e.message }, 502);
	}

	// Fetch reference buffers in parallel. The mana-media /file route is
	// public, so no auth header needed — ownership was already verified.
	let referenceBlobs: Array<{ blob: Blob; filename: string }>;
	try {
		const { getMediaBuffer } = await import('../../lib/media');
		const buffers = await Promise.all(refIds.map((id) => getMediaBuffer(id)));
		referenceBlobs = buffers.map((b, i) => {
			const ext = b.mimeType.split('/')[1]?.split(';')[0] ?? 'png';
			return {
				blob: new Blob([b.buffer], { type: b.mimeType }),
				filename: `ref-${i}.${ext === 'jpeg' ? 'jpg' : ext}`,
			};
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[picture/generate-with-reference] failed to fetch reference media', {
			refIds,
			error: message,
		});
		return c.json({ error: 'Failed to fetch reference media', detail: message }, 502);
	}

	// Multipart POST to OpenAI. FormData auto-sets Content-Type with a
	// boundary; setting it manually would break parsing on OpenAI's end.
	const formData = new FormData();
	formData.append('model', openaiModel);
	formData.append('prompt', prompt);
	formData.append('size', size);
	formData.append('quality', quality);
	formData.append('n', String(effectiveBatch));
	// gpt-image-* requires the array-syntax `image[]` for multi-reference
	// calls — a repeated plain `image` field triggers OpenAI's
	// `duplicate_parameter` error even though the old DALL·E edits
	// endpoint tolerated it. Keep `image[]` for the single-ref case too:
	// OpenAI accepts the array form with any cardinality ≥ 1, so there's
	// no need to branch here.
	for (const ref of referenceBlobs) {
		formData.append('image[]', ref.blob, ref.filename);
	}

	let generatedBuffers: ArrayBuffer[];
	try {
		const res = await fetch('https://api.openai.com/v1/images/edits', {
			method: 'POST',
			headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
			body: formData,
		});
		if (!res.ok) {
			const detail = await res.text().catch(() => '');
			console.error('[picture/generate-with-reference] OpenAI returned non-ok', {
				status: res.status,
				statusText: res.statusText,
				body: detail.slice(0, 1000),
				refCount: referenceBlobs.length,
				prompt: prompt.slice(0, 120),
				model: openaiModel,
				size,
				quality,
			});
			return c.json({ error: 'OpenAI image edit failed', detail: detail.slice(0, 500) }, 502);
		}
		const data = (await res.json()) as { data?: Array<{ b64_json?: string }> };
		const blobs = (data.data ?? []).map((d) => d.b64_json).filter((b): b is string => !!b);
		if (blobs.length === 0) return c.json({ error: 'OpenAI returned no image data' }, 502);
		generatedBuffers = blobs.map((b64) => {
			const bin = Buffer.from(b64, 'base64');
			return bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength) as ArrayBuffer;
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[picture/generate-with-reference] OpenAI fetch threw', { error: message });
		return c.json({ error: 'OpenAI image edit failed', detail: message }, 502);
	}

	// Success path: consume credits, then upload the new images.
	// Credits are consumed before the mana-media upload so a mana-media
	// outage doesn't let the user retry free of charge after the model
	// already ran (OpenAI already billed us).
	await consumeCredits(userId, 'AI_IMAGE_GENERATION', cost, `Image edit: ${prompt.slice(0, 50)}`);

	try {
		const { uploadImageToMedia } = await import('../../lib/media');
		const images: Array<{ imageUrl: string; mediaId: string; thumbnailUrl?: string }> = [];
		const ts = Date.now();
		let idx = 0;
		for (const buf of generatedBuffers) {
			const media = await uploadImageToMedia(buf, `edit-${ts}-${idx}.png`, {
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
			model,
			referenceMediaIds: refIds,
			mode: 'edit',
			// Back-compat: first image exposed at top level too, matching /generate.
			imageUrl: images[0]?.imageUrl,
			mediaId: images[0]?.mediaId,
			thumbnailUrl: images[0]?.thumbnailUrl,
		});
	} catch (_err) {
		// OpenAI already produced images and credits were consumed — degrade
		// to returning the base64 inline so the client can still persist
		// them locally rather than losing the generation entirely.
		const inlineImages = generatedBuffers.map((buf, i) => ({
			mediaId: `inline-${Date.now()}-${i}`,
			imageUrl: `data:image/png;base64,${Buffer.from(buf).toString('base64')}`,
		}));
		return c.json({
			images: inlineImages,
			prompt,
			model,
			referenceMediaIds: refIds,
			mode: 'edit',
			warning: 'mana-media upload failed, images returned inline',
			imageUrl: inlineImages[0]?.imageUrl,
		});
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
