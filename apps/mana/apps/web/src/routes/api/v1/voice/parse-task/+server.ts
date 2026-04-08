/**
 * POST /api/v1/voice/parse-task
 *
 * Turn a spoken-task transcript into structured task data via mana-llm.
 * Used by the Todo voice quick-add flow: the user speaks a task like
 * "Steuererklärung morgen 14 Uhr" and we extract title + due date.
 *
 * Graceful degradation is the rule here, not the exception. If mana-llm
 * is unreachable, mis-configured, or returns garbage JSON, fall back to
 * { title: transcript } with no error — the user still gets a usable
 * task and can edit it inline. The goal is "voice quick-add never fails
 * harder than a typed quick-add", not "voice quick-add only works when
 * the LLM is happy".
 *
 * Request:  { transcript: string, language?: string }
 * Response: { title, dueDate, priority, labels } — same shape regardless
 *           of whether the LLM ran or we fell through to the fallback.
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { coerce, extractJson, fallback } from './coerce';

const MAX_TRANSCRIPT_CHARS = 1000;
const LLM_TIMEOUT_MS = 8000;
// gemma3:12b consistently nails relative date math ("nächsten Montag"
// from a Wednesday → next Monday's date) and respects "null when
// absent" for both dueDate and priority. gemma3:4b gets weekday math
// off-by-one and stamps today's date on every bare task. The 12b
// model is only ~10% slower in practice on the GPU box (~1.1s vs
// ~1.0s for these tiny prompts) so the accuracy win is essentially
// free. The deterministic guards in coerce() are still kept as a
// safety net in case the GPU box swaps in a weaker model.
const DEFAULT_MODEL = 'ollama/gemma3:12b';

function buildPrompt(transcript: string, language: string): string {
	const now = new Date();
	const today = now.toISOString().slice(0, 10);
	const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
	const langName = language === 'de' ? 'German' : language === 'en' ? 'English' : language;
	// Few-shot prompt. Pure rule descriptions made gemma3:12b drop
	// subjects from titles ("Anna anrufen" → "Anrufen") and miscount
	// weekdays (off-by-one for "nächsten Montag"). Showing the model
	// what good output looks like for the exact failure modes works
	// where prose instructions don't. The deterministic guards in
	// coerce() are still kept as a backstop.
	return [
		`You parse spoken ${langName} tasks into JSON. Today is ${today} (${weekday}).`,
		'',
		'Output ONLY a JSON object. No code fences. Keys:',
		'  title    — keep the full subject, just drop filler words',
		'  dueDate  — YYYY-MM-DD, or null if no date is mentioned',
		'  priority — "low" | "medium" | "high", or null if not mentioned',
		'  labels   — array of short topic words from the transcript (may be empty)',
		'',
		'Examples (assume today is 2026-04-08, a Wednesday):',
		'',
		'Transcript: "Mülltonnen rausstellen"',
		'{"title":"Mülltonnen rausstellen","dueDate":null,"priority":null,"labels":["müll"]}',
		'',
		'Transcript: "Steuererklärung morgen 14 Uhr unbedingt erledigen"',
		'{"title":"Steuererklärung erledigen","dueDate":"2026-04-09","priority":"high","labels":["steuern"]}',
		'',
		'Transcript: "Anna nächsten Montag anrufen"',
		'{"title":"Anna anrufen","dueDate":"2026-04-13","priority":null,"labels":["anruf"]}',
		'',
		'Transcript: "Buy milk"',
		'{"title":"Buy milk","dueDate":null,"priority":null,"labels":["grocery"]}',
		'',
		'Transcript: "Call dentist tomorrow at 3pm"',
		'{"title":"Call dentist","dueDate":"2026-04-09","priority":null,"labels":["dentist"]}',
		'',
		`Transcript: ${JSON.stringify(transcript)}`,
	].join('\n');
}

export const POST: RequestHandler = async ({ request }) => {
	let body: { transcript?: string; language?: string };
	try {
		body = await request.json();
	} catch {
		return json(fallback(''));
	}

	const transcript = (body.transcript ?? '').slice(0, MAX_TRANSCRIPT_CHARS).trim();
	const language = body.language ?? 'de';
	if (!transcript) return json(fallback(''));

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
					{ role: 'user', content: buildPrompt(transcript, language) },
				],
			}),
		});
	} catch {
		clearTimeout(timer);
		return json(fallback(transcript));
	}
	clearTimeout(timer);

	if (!response.ok) return json(fallback(transcript));

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		return json(fallback(transcript));
	}

	const content =
		(payload as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message
			?.content ?? '';
	const parsed = extractJson(content);
	return json(coerce(parsed, transcript));
};
