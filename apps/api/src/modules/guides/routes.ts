/**
 * Guides module — Content import (URL/text/AI) + shareable links
 * Ported from apps/guides/apps/server
 *
 * All CRUD is handled client-side via local-first + mana-sync.
 * This module handles web import via mana-search + mana-llm, and share links.
 */

import { Hono, type Context } from 'hono';
import { logger } from '@mana/shared-hono';

const MANA_SEARCH_URL = process.env.MANA_SEARCH_URL ?? 'http://localhost:3021';
const MANA_LLM_URL = process.env.MANA_LLM_URL ?? 'http://localhost:3030';

const routes = new Hono();

// ─── Import: URL ────────────────────────────────────────────

routes.post('/import/url', async (c) => {
	const body = await c.req.json<{ url: string }>();
	const { url } = body;

	if (!url || !URL.canParse(url)) {
		return c.json({ error: 'Ungültige URL' }, 400);
	}

	// Extract content via mana-search
	let extracted: { title?: string; content?: string; markdown?: string } = {};
	try {
		const res = await fetch(`${MANA_SEARCH_URL}/api/v1/extract`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url, options: { includeMarkdown: true } }),
		});
		if (res.ok) {
			extracted = await res.json();
		}
	} catch (e) {
		logger.error('guides.extract_failed', { error: e instanceof Error ? e.message : String(e) });
	}

	const content = extracted.markdown ?? extracted.content ?? '';
	if (!content) {
		return c.json({ error: 'Inhalt konnte nicht extrahiert werden' }, 422);
	}

	return await generateGuideFromText(c, {
		title: extracted.title,
		text: content,
		sourceUrl: url,
	});
});

// ─── Import: Text/Markdown ──────────────────────────────────

routes.post('/import/text', async (c) => {
	const body = await c.req.json<{ text: string; title?: string }>();
	const { text, title } = body;

	if (!text?.trim()) {
		return c.json({ error: 'Kein Text angegeben' }, 400);
	}

	return await generateGuideFromText(c, { text, title });
});

// ─── Import: AI Generation ──────────────────────────────────

routes.post('/import/ai', async (c) => {
	const body = await c.req.json<{ prompt: string; title?: string }>();
	const { prompt, title } = body;

	if (!prompt?.trim()) {
		return c.json({ error: 'Kein Prompt angegeben' }, 400);
	}

	return await generateGuideFromText(c, {
		text: prompt,
		title,
		isAiPrompt: true,
	});
});

// ─── Share: Create + Retrieve ───────────────────────────────

// In-memory store for shared guides (replace with DB later)
const sharedGuides = new Map<
	string,
	{ guide: unknown; sections: unknown[]; createdAt: string; expiresAt: string }
>();

routes.post('/share', async (c) => {
	const body = await c.req.json<{ guide: unknown; sections: unknown[] }>();

	if (!body.guide) {
		return c.json({ error: 'Kein Guide-Inhalt angegeben' }, 400);
	}

	const token = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

	sharedGuides.set(token, {
		guide: body.guide,
		sections: body.sections ?? [],
		createdAt: new Date().toISOString(),
		expiresAt,
	});

	const baseUrl = process.env.PUBLIC_BASE_URL ?? 'http://localhost:5200';
	return c.json({ token, url: `${baseUrl}/shared/${token}`, expiresAt });
});

routes.get('/share/:token', (c) => {
	const { token } = c.req.param();
	const shared = sharedGuides.get(token);

	if (!shared) {
		return c.json({ error: 'Guide nicht gefunden oder Link abgelaufen' }, 404);
	}

	if (new Date(shared.expiresAt) < new Date()) {
		sharedGuides.delete(token);
		return c.json({ error: 'Dieser Link ist abgelaufen' }, 410);
	}

	return c.json(shared);
});

// ─── Shared: LLM guide generation ──────────────────────────

async function generateGuideFromText(
	c: Context,
	opts: { text: string; title?: string; sourceUrl?: string; isAiPrompt?: boolean }
) {
	const systemPrompt = `Du bist ein Experte für das Erstellen strukturierter Schritt-für-Schritt-Anleitungen.
Analysiere den folgenden Text und erstelle daraus eine strukturierte Anleitung im JSON-Format.

Antworte NUR mit einem validen JSON-Objekt in diesem exakten Format:
{
  "title": "Titel der Anleitung",
  "description": "Kurze Beschreibung (1-2 Sätze)",
  "category": "Technik|Kochen|Sport|Lernen|Arbeit|Haushalt|Hobby|Allgemein",
  "difficulty": "easy|medium|hard",
  "estimatedMinutes": Zahl,
  "tags": ["tag1", "tag2"],
  "sections": [
    {
      "title": "Abschnitt-Titel (optional, leer lassen wenn keine Sections nötig)",
      "steps": [
        {
          "title": "Schritt-Titel",
          "content": "Optionale Details oder Code",
          "type": "instruction|warning|tip|checkpoint|code"
        }
      ]
    }
  ]
}

Regeln:
- Maximal 3-4 Abschnitte, maximal 8-10 Schritte pro Abschnitt
- type "warning" nur bei wirklichen Warnungen/Gefahren
- type "tip" für hilfreiche Hinweise
- type "code" wenn der Inhalt Kommandos oder Code enthält
- type "checkpoint" für Überprüfungsschritte
- Wenn kein sinnvolles Abschnitt-System, eine leere Section mit title ""
- Schritt-Titel: prägnant, maximal 80 Zeichen
- Auf Deutsch antworten`;

	const userMessage = opts.isAiPrompt
		? `Erstelle eine Anleitung für: ${opts.text}`
		: `Hier ist der Inhalt, den du in eine Anleitung umwandeln sollst:\n\n${opts.text.slice(0, 8000)}`;

	try {
		const llmRes = await fetch(`${MANA_LLM_URL}/api/v1/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userMessage },
				],
				model: 'claude-haiku-4-5-20251001',
				temperature: 0.3,
				maxTokens: 4096,
			}),
		});

		if (!llmRes.ok) {
			throw new Error(`LLM error: ${llmRes.status}`);
		}

		const llmData = (await llmRes.json()) as { content: string };
		const rawJson = llmData.content.trim();

		// Extract JSON from potential markdown code fences
		const jsonMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ?? [null, rawJson];
		const parsed = JSON.parse(jsonMatch[1] ?? rawJson);

		return c.json({
			guide: {
				title: opts.title ?? parsed.title,
				description: parsed.description,
				category: parsed.category ?? 'Allgemein',
				difficulty: parsed.difficulty ?? 'medium',
				estimatedMinutes: parsed.estimatedMinutes,
				tags: parsed.tags ?? [],
				sourceUrl: opts.sourceUrl,
			},
			sections: parsed.sections ?? [],
		});
	} catch (e) {
		logger.error('guides.generate_failed', { error: e instanceof Error ? e.message : String(e) });
		return c.json({ error: 'Guide-Generierung fehlgeschlagen', details: String(e) }, 500);
	}
}

export { routes as guidesRoutes };
