/**
 * Context module — AI text generation + token estimation
 * Ported from apps/context/apps/server
 *
 * CRUD for spaces/documents handled by mana-sync.
 */

import { Hono } from 'hono';
import { consumeCredits, validateCredits } from '@mana/shared-hono/credits';
import type { AuthVariables } from '@mana/shared-hono';

const LLM_URL = process.env.MANA_LLM_URL || 'http://localhost:3025';

const routes = new Hono<{ Variables: AuthVariables }>();

// ─── AI Generation (server-only: mana-llm) ──────────────────

routes.post('/ai/generate', async (c) => {
	const userId = c.get('userId');
	const { prompt, documents, model, maxTokens } = await c.req.json();

	if (!prompt) return c.json({ error: 'prompt required' }, 400);

	// Validate credits
	const validation = await validateCredits(userId, 'AI_CONTEXT_GENERATE', 5);
	if (!validation.hasCredits) {
		return c.json(
			{ error: 'Insufficient credits', required: 5, available: validation.availableCredits },
			402
		);
	}

	try {
		// Build messages with document context
		const messages: Array<{ role: string; content: string }> = [];

		if (documents?.length) {
			const contextText = documents
				.map((d: { title: string; content: string }) => `--- ${d.title} ---\n${d.content}`)
				.join('\n\n');
			messages.push({
				role: 'system',
				content: `Verwende diese Dokumente als Kontext:\n\n${contextText}`,
			});
		}

		messages.push({ role: 'user', content: prompt });

		const res = await fetch(`${LLM_URL}/api/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages,
				model: model || 'gemma3:4b',
				max_tokens: maxTokens || 2000,
			}),
		});

		if (!res.ok) return c.json({ error: 'AI generation failed' }, 502);

		const data = await res.json();
		const content = data.choices?.[0]?.message?.content || '';
		const tokensUsed = data.usage?.total_tokens || 0;

		// Consume credits
		await consumeCredits(userId, 'AI_CONTEXT_GENERATE', 5, `AI generation (${tokensUsed} tokens)`);

		return c.json({ content, tokensUsed, model: model || 'gemma3:4b' });
	} catch (_err) {
		return c.json({ error: 'Generation failed' }, 500);
	}
});

routes.post('/ai/estimate', async (c) => {
	const { prompt, documents } = await c.req.json();
	const charCount =
		(prompt?.length || 0) +
		(documents || []).reduce(
			(sum: number, d: { content: string }) => sum + (d.content?.length || 0),
			0
		);
	const estimatedTokens = Math.ceil(charCount / 4);
	return c.json({ estimatedTokens, estimatedCost: 5 });
});

export { routes as contextRoutes };
