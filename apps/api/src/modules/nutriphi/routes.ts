/**
 * NutriPhi module — Meal analysis (Gemini) + recommendations
 * Ported from apps/nutriphi/apps/server
 *
 * CRUD for meals, goals, favorites handled by mana-sync.
 * This module handles AI analysis and rule-based recommendations.
 */

import { Hono } from 'hono';
import { logger, type AuthVariables } from '@mana/shared-hono';

const LLM_URL = process.env.MANA_LLM_URL || 'http://localhost:3025';

const ANALYSIS_PROMPT = `Du bist ein Ernährungsexperte. Analysiere die Mahlzeit und gib ein JSON zurück mit:
{
  "foods": [{"name": "...", "quantity": "...", "calories": 0}],
  "totalNutrition": {"calories": 0, "protein": 0, "carbohydrates": 0, "fat": 0, "fiber": 0, "sugar": 0},
  "description": "Kurze Beschreibung der Mahlzeit",
  "confidence": 0.0-1.0,
  "warnings": [],
  "suggestions": []
}`;

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

// ─── Photo Analysis (server-only: Gemini Vision on uploaded URL) ──

routes.post('/analysis/photo', async (c) => {
	const { photoUrl } = await c.req.json();
	if (!photoUrl) return c.json({ error: 'photoUrl required' }, 400);

	try {
		const res = await fetch(`${LLM_URL}/api/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages: [
					{ role: 'system', content: ANALYSIS_PROMPT },
					{
						role: 'user',
						content: [
							{ type: 'text', text: 'Analysiere diese Mahlzeit.' },
							{ type: 'image_url', image_url: { url: photoUrl } },
						],
					},
				],
				model: process.env.VISION_MODEL || 'gemini-2.0-flash',
				response_format: { type: 'json_object' },
				temperature: 0.3,
			}),
		});

		if (!res.ok) return c.json({ error: 'AI analysis failed' }, 502);

		const data = await res.json();
		const content = data.choices?.[0]?.message?.content;
		const analysis = typeof content === 'string' ? JSON.parse(content) : content;

		return c.json(analysis);
	} catch (err) {
		logger.error('nutriphi.photo_analysis_failed', {
			error: err instanceof Error ? err.message : String(err),
		});
		return c.json({ error: 'Analysis failed' }, 500);
	}
});

// ─── Text Analysis (server-only: Gemini) ─────────────────────

routes.post('/analysis/text', async (c) => {
	const { description } = await c.req.json();
	if (!description) return c.json({ error: 'description required' }, 400);

	try {
		const res = await fetch(`${LLM_URL}/api/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages: [
					{ role: 'system', content: ANALYSIS_PROMPT },
					{ role: 'user', content: `Analysiere diese Mahlzeit: ${description}` },
				],
				model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
				response_format: { type: 'json_object' },
				temperature: 0.3,
			}),
		});

		if (!res.ok) return c.json({ error: 'AI analysis failed' }, 502);

		const data = await res.json();
		const content = data.choices?.[0]?.message?.content;
		const analysis = typeof content === 'string' ? JSON.parse(content) : content;

		return c.json(analysis);
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
