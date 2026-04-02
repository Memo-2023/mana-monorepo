/**
 * Import routes — convert URLs or raw text into structured guide data.
 *
 * POST /api/v1/import/url   → fetch URL via mana-search extract, return guide draft
 * POST /api/v1/import/text  → parse plain text / markdown into guide steps
 * POST /api/v1/import/ai    → send to mana-llm to generate structured guide
 */

import { Hono } from 'hono';

export const importRoutes = new Hono();

const MANA_SEARCH_URL = process.env.MANA_SEARCH_URL ?? 'http://localhost:3021';
const MANA_LLM_URL = process.env.MANA_LLM_URL ?? 'http://localhost:3030';

// ─── URL Import ─────────────────────────────────────────────────────────────

importRoutes.post('/url', async (c) => {
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
		console.error('mana-search extract failed:', e);
	}

	const content = extracted.markdown ?? extracted.content ?? '';
	if (!content) {
		return c.json({ error: 'Inhalt konnte nicht extrahiert werden' }, 422);
	}

	// Use mana-llm to turn raw content into structured guide
	return await generateGuideFromText(c, {
		title: extracted.title,
		text: content,
		sourceUrl: url,
	});
});

// ─── Text/Markdown Import ────────────────────────────────────────────────────

importRoutes.post('/text', async (c) => {
	const body = await c.req.json<{ text: string; title?: string }>();
	const { text, title } = body;

	if (!text?.trim()) {
		return c.json({ error: 'Kein Text angegeben' }, 400);
	}

	return await generateGuideFromText(c, { text, title });
});

// ─── AI Generation ───────────────────────────────────────────────────────────

importRoutes.post('/ai', async (c) => {
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

// ─── Shared: LLM guide generation ───────────────────────────────────────────

async function generateGuideFromText(
	c: Parameters<Parameters<typeof Hono.prototype.post>[1]>[0],
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

		const llmData = await llmRes.json<{ content: string }>();
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
		console.error('Guide generation failed:', e);
		return c.json({ error: 'Guide-Generierung fehlgeschlagen', details: String(e) }, 500);
	}
}
