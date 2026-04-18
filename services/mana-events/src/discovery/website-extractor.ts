/**
 * Website Extractor — LLM-based event extraction from unstructured web pages.
 *
 * Pipeline:
 *   1. Crawl the page via mana-research POST /api/v1/extract
 *   2. Feed the extracted text to mana-llm with a structured output prompt
 *   3. Parse the LLM response as NormalizedEvent[]
 *
 * Uses cheap/fast models (gemma3:4b or haiku) to keep costs low.
 * Falls back gracefully on any failure — one bad page doesn't crash the batch.
 */

import type { NormalizedEvent } from './types';

const EXTRACT_TIMEOUT_MS = 20_000;
const LLM_TIMEOUT_MS = 30_000;
const MAX_CONTENT_CHARS = 15_000; // Trim long pages to stay within context window

interface ExtractResponse {
	success: boolean;
	data?: {
		content: {
			title?: string;
			text?: string;
			markdown?: string;
			html?: string;
		};
	};
}

interface ChatCompletionResponse {
	choices: Array<{
		message: {
			content: string;
		};
	}>;
}

/**
 * Extract events from a website URL.
 *
 * 1. Fetches + renders the page via mana-research (Firecrawl/Jina/Readability)
 * 2. Sends the text to mana-llm with a structured extraction prompt
 * 3. Parses JSON output into NormalizedEvent[]
 */
export async function extractEventsFromWebsite(
	url: string,
	sourceName: string,
	manaResearchUrl: string,
	manaLlmUrl: string
): Promise<NormalizedEvent[]> {
	// Step 1: Extract page content
	const content = await fetchPageContent(url, manaResearchUrl);
	if (!content) return [];

	// Step 2: LLM extraction
	const events = await llmExtractEvents(content, url, sourceName, manaLlmUrl);
	return events;
}

/** Fetch and extract text content from a URL via mana-research. */
async function fetchPageContent(url: string, manaResearchUrl: string): Promise<string | null> {
	try {
		const res = await fetch(`${manaResearchUrl}/api/v1/extract`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url }),
			signal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS),
		});

		if (!res.ok) {
			console.warn(`[website-extractor] extract failed ${res.status}: ${url}`);
			return null;
		}

		const data = (await res.json()) as ExtractResponse;
		if (!data.success || !data.data?.content) return null;

		// Prefer markdown > text > html
		const text = data.data.content.markdown || data.data.content.text || '';
		if (text.length < 50) return null; // Too short to contain events

		// Trim to stay within LLM context window
		return text.slice(0, MAX_CONTENT_CHARS);
	} catch (err) {
		console.warn(`[website-extractor] fetch error for ${url}:`, err);
		return null;
	}
}

/** Build the LLM system prompt for event extraction. */
function buildExtractionPrompt(): string {
	const today = new Date().toISOString().slice(0, 10);
	return `Du bist ein Event-Extractor. Extrahiere ALLE kommenden Veranstaltungen von der gegebenen Webseite.

Pro Event liefere:
- title (string, Pflicht) — Name der Veranstaltung
- date (string, Pflicht) — Startdatum im Format YYYY-MM-DD
- time (string, optional) — Startzeit im Format HH:MM
- endDate (string, optional) — Enddatum falls mehrtägig
- endTime (string, optional) — Endzeit
- location (string, optional) — Veranstaltungsort / Adresse
- description (string, optional) — Kurzbeschreibung, max 300 Zeichen
- category (string, optional) — Eine von: music, theater, art, tech, sport, food, family, nature, education, community, nightlife, market, other
- priceInfo (string, optional) — Preis, z.B. "Eintritt frei", "15 EUR", "VVK 12 / AK 15"

Heutiges Datum: ${today}
Ignoriere vergangene Events (vor ${today}).
Antwort als JSON-Objekt mit einem "events"-Array. Kein Markdown, nur JSON.`;
}

/** Send page content to mana-llm for structured event extraction. */
async function llmExtractEvents(
	pageContent: string,
	sourceUrl: string,
	sourceName: string,
	manaLlmUrl: string
): Promise<NormalizedEvent[]> {
	try {
		const res = await fetch(`${manaLlmUrl}/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'ollama/gemma3:4b',
				messages: [
					{ role: 'system', content: buildExtractionPrompt() },
					{ role: 'user', content: `Extrahiere Events von dieser Seite:\n\n${pageContent}` },
				],
				max_tokens: 2048,
				temperature: 0,
				response_format: { type: 'json_object' },
			}),
			signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
		});

		if (!res.ok) {
			console.warn(`[website-extractor] LLM failed ${res.status}`);
			return [];
		}

		const completion = (await res.json()) as ChatCompletionResponse;
		const rawJson = completion.choices?.[0]?.message?.content ?? '';

		return parseExtractedEvents(rawJson, sourceUrl, sourceName);
	} catch (err) {
		console.warn(`[website-extractor] LLM error:`, err);
		return [];
	}
}

/** Parse and validate LLM JSON output into NormalizedEvents. */
export function parseExtractedEvents(
	rawJson: string,
	sourceUrl: string,
	sourceName: string
): NormalizedEvent[] {
	try {
		// Strip markdown fences if present
		const cleaned = rawJson.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '');
		const parsed = JSON.parse(cleaned);
		const rawEvents = parsed.events ?? parsed;

		if (!Array.isArray(rawEvents)) return [];

		const now = new Date();
		const events: NormalizedEvent[] = [];

		for (const raw of rawEvents) {
			if (!raw.title || !raw.date) continue;

			// Parse date — LLMs sometimes return "25. April 2026" instead of ISO
			const startAt = parseFlexibleDate(raw.date, raw.time);
			if (!startAt || isNaN(startAt.getTime())) continue;

			// Skip past events
			if (startAt.getTime() < now.getTime() - 24 * 60 * 60 * 1000) continue;

			const endAt = raw.endDate ? parseFlexibleDate(raw.endDate, raw.endTime) : null;

			events.push({
				title: String(raw.title).trim().slice(0, 200),
				description: raw.description ? String(raw.description).trim().slice(0, 2000) : null,
				location: raw.location ? String(raw.location).trim() : null,
				startAt,
				endAt,
				allDay: !raw.time,
				sourceUrl,
				category: raw.category ?? null,
				priceInfo: raw.priceInfo ? String(raw.priceInfo).trim() : null,
			});
		}

		return events;
	} catch (err) {
		console.warn(`[website-extractor] JSON parse error:`, err);
		return [];
	}
}

/** Parse dates flexibly — handles ISO, German formats, and partial dates. */
function parseFlexibleDate(dateStr: string, timeStr?: string): Date | null {
	if (!dateStr) return null;

	// Try ISO format first (YYYY-MM-DD)
	const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (isoMatch) {
		const [, y, m, d] = isoMatch;
		const time = parseTime(timeStr);
		return new Date(`${y}-${m}-${d}T${time}:00`);
	}

	// Try German format (DD.MM.YYYY)
	const deMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
	if (deMatch) {
		const [, d, m, y] = deMatch;
		const time = parseTime(timeStr);
		return new Date(`${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}T${time}:00`);
	}

	// Fallback: let Date parse it
	try {
		const d = new Date(dateStr);
		if (!isNaN(d.getTime())) return d;
	} catch {
		// ignore
	}

	return null;
}

function parseTime(timeStr?: string): string {
	if (!timeStr) return '00:00';
	const match = timeStr.match(/(\d{1,2}):(\d{2})/);
	if (match) return `${match[1]!.padStart(2, '0')}:${match[2]}`;
	return '00:00';
}
