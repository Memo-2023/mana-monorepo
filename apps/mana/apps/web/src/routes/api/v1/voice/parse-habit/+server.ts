/**
 * POST /api/v1/voice/parse-habit
 *
 * Pick the right habit out of the user's habit list given a spoken
 * transcript. Used by the Habits voice quick-log flow: the user says
 * "kaffee" or "ich bin 30 minuten gelaufen" and we need to figure out
 * which of their existing habits this maps to.
 *
 * The browser does a cheap substring pre-match before calling this —
 * so by the time we get here, the obvious cases ("kaffee" → habit
 * named "Kaffee") have already been resolved client-side. This
 * endpoint exists for the harder cases where the spoken word doesn't
 * literally appear in any habit title ("gelaufen" → "Laufen",
 * "rauchen" → "Zigarette").
 *
 * Request:  { transcript: string, habits: string[], language?: string }
 * Response: { match: string | null, note: string | null }
 *
 * `match` is one of the input habit titles verbatim, or null if the
 * LLM couldn't pick one with confidence. `note` is any extra context
 * the LLM extracted (e.g., "5 km" or "stark"). The browser does the
 * habit-id lookup itself, so the endpoint never sees IDs.
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const MAX_TRANSCRIPT_CHARS = 500;
const MAX_HABITS = 50;
const LLM_TIMEOUT_MS = 8000;
// gemma3:12b is more consistent than 4b at the "pick from this list,
// don't paraphrase" instruction — 4b sometimes returns "Joggen" when
// "Laufen" was in the list, which the verbatim-validation in coerce
// then drops, costing an LLM round-trip for nothing. The accuracy
// win matters more here than for parse-task because parse-habit only
// runs at all when the cheap client-side substring fast path missed.
const DEFAULT_MODEL = 'ollama/gemma3:12b';

interface ParseResult {
	match: string | null;
	note: string | null;
}

function fallback(): ParseResult {
	return { match: null, note: null };
}

function buildPrompt(transcript: string, habits: string[], language: string): string {
	const langName = language === 'de' ? 'German' : language === 'en' ? 'English' : language;
	return [
		`The user spoke a habit log entry in ${langName}. Pick which habit they meant.`,
		'',
		'Habits the user has defined (these are the ONLY allowed match values):',
		...habits.map((h) => `  - ${h}`),
		'',
		'Return ONLY a JSON object with these exact keys:',
		'  - match: one of the habit names above, copied verbatim, or null if none fits',
		'  - note: any extra context the user mentioned (duration, intensity, count, …) or null',
		'',
		'Rules:',
		'- If the spoken text plausibly maps to one habit (e.g. "gelaufen" → "Laufen", ',
		'  "rauchen" → "Zigarette"), pick it.',
		'- If multiple habits could fit, pick the most likely one.',
		'- If nothing fits with reasonable confidence, return null. Do not guess wildly.',
		'- The match value MUST be copied verbatim from the list above. Never invent a name.',
		'- Output JSON only, no markdown, no commentary, no code fences.',
		'',
		`Transcript: ${JSON.stringify(transcript)}`,
	].join('\n');
}

function coerce(raw: unknown, allowedHabits: string[]): ParseResult {
	if (!raw || typeof raw !== 'object') return fallback();
	const r = raw as Record<string, unknown>;
	const matchRaw = typeof r.match === 'string' ? r.match.trim() : null;
	// Only honor a match value that's verbatim in the allowed list — the
	// model might paraphrase ("Joggen" instead of "Laufen") and we'd rather
	// drop the match than log against a non-existent habit.
	const match = matchRaw && allowedHabits.includes(matchRaw) ? matchRaw : null;
	const note = typeof r.note === 'string' && r.note.trim() ? r.note.trim() : null;
	return { match, note };
}

function extractJson(text: string): unknown {
	const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
	const body = fenced ? fenced[1] : text;
	const start = body.indexOf('{');
	const end = body.lastIndexOf('}');
	if (start === -1 || end === -1 || end < start) return null;
	try {
		return JSON.parse(body.slice(start, end + 1));
	} catch {
		return null;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	let body: { transcript?: string; habits?: string[]; language?: string };
	try {
		body = await request.json();
	} catch {
		return json(fallback());
	}

	const transcript = (body.transcript ?? '').slice(0, MAX_TRANSCRIPT_CHARS).trim();
	const habits = Array.isArray(body.habits)
		? body.habits
				.filter((h): h is string => typeof h === 'string' && h.trim().length > 0)
				.slice(0, MAX_HABITS)
		: [];
	const language = body.language ?? 'de';
	if (!transcript || habits.length === 0) return json(fallback());

	const llmUrl = env.MANA_LLM_URL || env.PUBLIC_MANA_LLM_URL || 'http://localhost:3025';
	const apiKey = env.MANA_LLM_API_KEY;

	let response: Response;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
	try {
		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		if (apiKey) headers['X-API-Key'] = apiKey;
		response = await fetch(`${llmUrl.replace(/\/$/, '')}/v1/chat/completions`, {
			method: 'POST',
			headers,
			signal: controller.signal,
			body: JSON.stringify({
				model: DEFAULT_MODEL,
				stream: false,
				temperature: 0,
				messages: [
					{ role: 'system', content: 'Output JSON only. No prose.' },
					{ role: 'user', content: buildPrompt(transcript, habits, language) },
				],
			}),
		});
	} catch {
		clearTimeout(timer);
		return json(fallback());
	}
	clearTimeout(timer);

	if (!response.ok) return json(fallback());

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		return json(fallback());
	}

	const content =
		(payload as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message
			?.content ?? '';
	const parsed = extractJson(content);
	return json(coerce(parsed, habits));
};
