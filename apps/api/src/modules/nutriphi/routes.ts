/**
 * NutriPhi module — Meal analysis (Gemini Vision via mana-llm) + recommendations.
 *
 * CRUD for meals, goals, favorites is handled by mana-sync. This module
 * owns the server-only operations: photo upload to mana-media, structured
 * AI analysis using the Vercel AI SDK (`generateObject`) against the
 * shared Zod schema in @mana/shared-types, and a small rule-based
 * recommendation engine.
 *
 * Why generateObject + Zod instead of raw fetch?
 *   - Runtime validation of the AI response — if Gemini drifts on a
 *     field, we throw at the boundary instead of corrupting downstream
 *     state. The frontend never sees malformed data.
 *   - Provider-portable structured outputs: the AI SDK translates one
 *     Zod schema into OpenAI strict json_schema / Anthropic tool-use /
 *     Gemini response_schema depending on which backend mana-llm routes
 *     to. We don't have to know which.
 *   - Single source of truth: the same MealAnalysisSchema is consumed
 *     by the unified web app via `z.infer<typeof MealAnalysisSchema>`,
 *     so changes here propagate end-to-end without manual sync.
 */

import { Hono } from 'hono';
import { generateObject } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { MealAnalysisSchema } from '@mana/shared-types';
import { logger, type AuthVariables } from '@mana/shared-hono';

const LLM_URL = process.env.MANA_LLM_URL || 'http://localhost:3025';
const VISION_MODEL = process.env.VISION_MODEL || 'gemini-2.0-flash';

const llm = createOpenAICompatible({
	name: 'mana-llm',
	baseURL: `${LLM_URL}/api/v1`,
});

const ANALYSIS_PROMPT = `Du bist ein Ernährungsexperte. Analysiere die Mahlzeit und gib strukturierte Nährwertdaten zurück. Schätze realistische Portionsgrößen und Kalorien. Antworte auf Deutsch.`;

const routes = new Hono<{ Variables: AuthVariables }>();

// ─── Photo Upload (server-only: S3 storage via mana-media) ───

routes.post('/photos/upload', async (c) => {
	const userId = c.get('userId');
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;

	if (!file) return c.json({ error: 'No file provided' }, 400);
	if (file.size > 10 * 1024 * 1024) return c.json({ error: 'File too large (max 10MB)' }, 400);

	try {
		const { uploadImageToMedia } = await import('../../lib/media');
		const buffer = await file.arrayBuffer();
		const result = await uploadImageToMedia(buffer, file.name, { app: 'nutriphi', userId });

		return c.json(
			{
				mediaId: result.id,
				publicUrl: result.urls.original,
				thumbnailUrl: result.urls.thumbnail || result.urls.original,
				storagePath: result.id,
			},
			201
		);
	} catch (err) {
		logger.error('nutriphi.upload_failed', {
			error: err instanceof Error ? err.message : String(err),
		});
		return c.json({ error: 'Upload failed' }, 500);
	}
});

// ─── Photo Analysis (Gemini Vision on uploaded URL) ──────────

routes.post('/analysis/photo', async (c) => {
	const { photoUrl } = await c.req.json();
	if (!photoUrl) return c.json({ error: 'photoUrl required' }, 400);

	try {
		const { object } = await generateObject({
			model: llm(VISION_MODEL),
			schema: MealAnalysisSchema,
			system: ANALYSIS_PROMPT,
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: 'Analysiere diese Mahlzeit.' },
						{ type: 'image', image: new URL(photoUrl) },
					],
				},
			],
			temperature: 0.3,
		});
		return c.json(object);
	} catch (err) {
		logger.error('nutriphi.photo_analysis_failed', {
			error: err instanceof Error ? err.message : String(err),
		});
		return c.json({ error: 'Analysis failed' }, 500);
	}
});

// ─── Text Analysis (Gemini on a free-text meal description) ──

routes.post('/analysis/text', async (c) => {
	const { description } = await c.req.json();
	if (!description) return c.json({ error: 'description required' }, 400);

	try {
		const { object } = await generateObject({
			model: llm(VISION_MODEL),
			schema: MealAnalysisSchema,
			system: ANALYSIS_PROMPT,
			prompt: `Analysiere diese Mahlzeit: ${description}`,
			temperature: 0.3,
		});
		return c.json(object);
	} catch (err) {
		logger.error('nutriphi.text_analysis_failed', {
			error: err instanceof Error ? err.message : String(err),
		});
		return c.json({ error: 'Analysis failed' }, 500);
	}
});

// ─── Recommendations (server-only: rule engine) ──────────────

routes.post('/recommendations/generate', async (c) => {
	const { dailyNutrition } = await c.req.json();
	const hints: Array<{ type: string; priority: string; message: string; nutrient?: string }> = [];

	if (dailyNutrition) {
		if (dailyNutrition.protein < 25) {
			hints.push({
				type: 'hint',
				priority: 'medium',
				message:
					'Deine Proteinzufuhr ist niedrig. Versuche Hülsenfrüchte, Eier oder Joghurt einzubauen.',
				nutrient: 'protein',
			});
		}
		if (dailyNutrition.fiber < 10) {
			hints.push({
				type: 'hint',
				priority: 'medium',
				message: 'Mehr Ballaststoffe! Vollkornprodukte, Gemüse und Obst helfen.',
				nutrient: 'fiber',
			});
		}
		if (dailyNutrition.sugar > 50) {
			hints.push({
				type: 'hint',
				priority: 'high',
				message:
					'Dein Zuckerkonsum ist hoch. Achte auf versteckten Zucker in Getränken und Fertigprodukten.',
				nutrient: 'sugar',
			});
		}
	}

	return c.json({ recommendations: hints });
});

export { routes as nutriphiRoutes };
