/**
 * Planta Hono Server — Compute-only endpoints
 *
 * Server-side logic:
 * - Photo upload to S3/MinIO
 * - AI plant analysis via mana-llm (Gemini Vision)
 * - Watering upcoming computation
 *
 * CRUD for plants, photos, watering handled by mana-sync.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, healthRoute, errorHandler, notFoundHandler } from '@manacore/shared-hono';

const PORT = parseInt(process.env.PORT || '3022', 10);
const LLM_URL = process.env.MANA_LLM_URL || 'http://localhost:3025';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const app = new Hono();

app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));
app.route('/health', healthRoute('planta-server'));
app.use('/api/*', authMiddleware());

// ─── Photo Upload (server-only: S3 storage) ─────────────────

app.post('/api/v1/photos/upload', async (c) => {
	const userId = c.get('userId');
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;
	const plantId = formData.get('plantId') as string | null;

	if (!file) return c.json({ error: 'No file provided' }, 400);
	if (file.size > 10 * 1024 * 1024) return c.json({ error: 'File too large (max 10MB)' }, 400);

	try {
		const { createPlantaStorage, generateUserFileKey, getContentType } = await import(
			'@manacore/shared-storage'
		);
		const storage = createPlantaStorage();
		const key = generateUserFileKey(userId, file.name);
		const buffer = Buffer.from(await file.arrayBuffer());

		const result = await storage.upload(key, buffer, {
			contentType: getContentType(file.name),
			public: true,
		});

		return c.json({ storagePath: key, publicUrl: result.url, plantId }, 201);
	} catch (err) {
		console.error('Upload failed:', err);
		return c.json({ error: 'Upload failed' }, 500);
	}
});

// ─── AI Analysis (server-only: Gemini Vision) ───────────────

app.post('/api/v1/analysis/identify', async (c) => {
	const { photoUrl } = await c.req.json();
	if (!photoUrl) return c.json({ error: 'photoUrl required' }, 400);

	try {
		const res = await fetch(`${LLM_URL}/api/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages: [
					{
						role: 'system',
						content:
							'Du bist ein Pflanzenexperte. Analysiere das Bild und gib JSON zurück: {scientificName, commonNames[], confidence, healthAssessment, wateringAdvice, lightAdvice, generalTips[]}',
					},
					{
						role: 'user',
						content: [
							{ type: 'text', text: 'Analysiere diese Pflanze.' },
							{ type: 'image_url', image_url: { url: photoUrl } },
						],
					},
				],
				model: process.env.VISION_MODEL || 'gemini-2.0-flash',
				response_format: { type: 'json_object' },
			}),
		});

		if (!res.ok) return c.json({ error: 'AI analysis failed' }, 502);

		const data = await res.json();
		const content = data.choices?.[0]?.message?.content;
		const analysis = typeof content === 'string' ? JSON.parse(content) : content;

		return c.json(analysis);
	} catch (err) {
		console.error('Analysis failed:', err);
		return c.json({ error: 'Analysis failed' }, 500);
	}
});

console.log(`planta-server starting on port ${PORT}...`);

export default { port: PORT, fetch: app.fetch };
