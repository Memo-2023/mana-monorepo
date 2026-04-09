/**
 * Planta module — Photo upload + AI plant identification.
 *
 * CRUD for plants, photos, watering is handled by mana-sync. This
 * module owns the server-only operations: photo upload to mana-media
 * and structured plant identification via the Vercel AI SDK
 * (`generateObject`) using the shared PlantIdentificationSchema in
 * @mana/shared-types. See nutriphi/routes.ts for the rationale behind
 * the AI SDK + Zod approach.
 */

import { Hono } from 'hono';
import { generateObject } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { PlantIdentificationSchema } from '@mana/shared-types';
import { logger, type AuthVariables } from '@mana/shared-hono';

const LLM_URL = process.env.MANA_LLM_URL || 'http://localhost:3025';
const VISION_MODEL = process.env.VISION_MODEL || 'gemini-2.0-flash';

const llm = createOpenAICompatible({
	name: 'mana-llm',
	baseURL: `${LLM_URL}/api/v1`,
});

const IDENTIFICATION_PROMPT = `Du bist ein Pflanzenexperte. Analysiere das Pflanzenfoto und liefere eine strukturierte Identifikation mit lateinischem Namen, deutschen Trivialnamen, Pflegehinweisen und einer Gesundheitseinschätzung. Antworte auf Deutsch.`;

const routes = new Hono<{ Variables: AuthVariables }>();

// ─── Photo Upload (server-only: S3 storage) ─────────────────

routes.post('/photos/upload', async (c) => {
	const userId = c.get('userId');
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;
	const plantId = formData.get('plantId') as string | null;

	if (!file) return c.json({ error: 'No file provided' }, 400);
	if (file.size > 10 * 1024 * 1024) return c.json({ error: 'File too large (max 10MB)' }, 400);

	try {
		const { uploadImageToMedia } = await import('../../lib/media');
		const buffer = await file.arrayBuffer();
		const result = await uploadImageToMedia(buffer, file.name, { app: 'planta', userId });

		return c.json(
			{
				storagePath: result.id,
				publicUrl: result.urls.original,
				mediaId: result.id,
				plantId,
			},
			201
		);
	} catch (err) {
		logger.error('planta.upload_failed', {
			error: err instanceof Error ? err.message : String(err),
		});
		return c.json({ error: 'Upload failed' }, 500);
	}
});

// ─── AI Analysis (Gemini Vision on uploaded URL) ─────────────

routes.post('/analysis/identify', async (c) => {
	const { photoUrl } = await c.req.json();
	if (!photoUrl) return c.json({ error: 'photoUrl required' }, 400);

	try {
		const { object } = await generateObject({
			model: llm(VISION_MODEL),
			schema: PlantIdentificationSchema,
			system: IDENTIFICATION_PROMPT,
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: 'Analysiere diese Pflanze.' },
						{ type: 'image', image: new URL(photoUrl) },
					],
				},
			],
		});
		return c.json(object);
	} catch (err) {
		logger.error('planta.analysis_failed', {
			error: err instanceof Error ? err.message : String(err),
		});
		return c.json({ error: 'Analysis failed' }, 500);
	}
});

export { routes as plantaRoutes };
