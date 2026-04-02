/**
 * NutriPhi module — Meal analysis (Gemini) + recommendations
 * Ported from apps/nutriphi/apps/server
 *
 * CRUD for meals, goals, favorites handled by mana-sync.
 * This module handles AI analysis and rule-based recommendations.
 */

import { Hono } from 'hono';

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

const routes = new Hono();

// ─── Photo Analysis (server-only: Gemini Vision) ────────────

routes.post('/analysis/photo', async (c) => {
	const { imageBase64, mimeType } = await c.req.json();
	if (!imageBase64) return c.json({ error: 'imageBase64 required' }, 400);

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
							{
								type: 'image_url',
								image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` },
							},
						],
					},
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
		console.error('Photo analysis failed:', err);
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
		console.error('Text analysis failed:', err);
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
