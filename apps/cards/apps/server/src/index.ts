/**
 * ManaDeck Hono Server — AI card/deck generation
 *
 * CRUD for decks/cards handled by mana-sync.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, healthRoute, errorHandler, notFoundHandler } from '@manacore/shared-hono';
import { consumeCredits, validateCredits } from '@manacore/shared-hono/credits';

const PORT = parseInt(process.env.PORT || '3009', 10);
const LLM_URL = process.env.MANA_LLM_URL || 'http://localhost:3025';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const app = new Hono();

app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));
app.route('/health', healthRoute('manadeck-server'));
app.use('/api/*', authMiddleware());

// ─── AI Deck Generation (server-only: mana-llm + credits) ───

app.post('/api/v1/decks/generate', async (c) => {
	const userId = c.get('userId');
	const { topic, cardCount, language } = await c.req.json();

	if (!topic) return c.json({ error: 'topic required' }, 400);
	const count = Math.min(cardCount || 10, 50);

	const cost = 20; // Credits per deck generation
	const validation = await validateCredits(userId, 'AI_DECK_GENERATION', cost);
	if (!validation.hasCredits) {
		return c.json(
			{ error: 'Insufficient credits', required: cost, available: validation.availableCredits },
			402
		);
	}

	try {
		const res = await fetch(`${LLM_URL}/api/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages: [
					{
						role: 'system',
						content: `Erstelle genau ${count} Karteikarten zum Thema. Gib JSON zurück: {"cards": [{"front": "Frage", "back": "Antwort"}]}. Sprache: ${language || 'Deutsch'}.`,
					},
					{ role: 'user', content: topic },
				],
				model: 'gemma3:4b',
				response_format: { type: 'json_object' },
			}),
		});

		if (!res.ok) return c.json({ error: 'AI generation failed' }, 502);

		const data = await res.json();
		const content = data.choices?.[0]?.message?.content;
		const parsed = typeof content === 'string' ? JSON.parse(content) : content;

		await consumeCredits(userId, 'AI_DECK_GENERATION', cost, `Deck: ${topic} (${count} cards)`);

		return c.json({ cards: parsed.cards || [], topic, cardCount: count });
	} catch (_err) {
		return c.json({ error: 'Generation failed' }, 500);
	}
});

// ─── AI Card Generation from Image (server-only: vision) ────

app.post('/api/v1/ai/generate-from-image', async (c) => {
	const userId = c.get('userId');
	const { imageUrl, imageBase64, mimeType } = await c.req.json();

	const cost = 2;
	const validation = await validateCredits(userId, 'AI_CARD_GENERATION', cost);
	if (!validation.hasCredits) {
		return c.json({ error: 'Insufficient credits' }, 402);
	}

	try {
		const imageContent = imageUrl
			? { type: 'image_url', image_url: { url: imageUrl } }
			: {
					type: 'image_url',
					image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` },
				};

		const res = await fetch(`${LLM_URL}/api/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages: [
					{
						role: 'system',
						content:
							'Erstelle Karteikarten aus dem Bildinhalt. JSON: {"cards": [{"front": "...", "back": "..."}]}',
					},
					{
						role: 'user',
						content: [
							{ type: 'text', text: 'Erstelle Karteikarten aus diesem Bild.' },
							imageContent,
						],
					},
				],
				model: 'gemini-2.0-flash',
				response_format: { type: 'json_object' },
			}),
		});

		if (!res.ok) return c.json({ error: 'AI failed' }, 502);

		const data = await res.json();
		const content = data.choices?.[0]?.message?.content;
		const parsed = typeof content === 'string' ? JSON.parse(content) : content;

		await consumeCredits(userId, 'AI_CARD_GENERATION', cost, 'Cards from image');

		return c.json({ cards: parsed.cards || [] });
	} catch (_err) {
		return c.json({ error: 'Generation failed' }, 500);
	}
});

export default { port: PORT, fetch: app.fetch };
