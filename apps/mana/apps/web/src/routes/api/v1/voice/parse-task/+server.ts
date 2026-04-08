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

interface ParseResult {
	title: string;
	dueDate: string | null; // ISO date (YYYY-MM-DD) or full ISO timestamp
	priority: 'low' | 'medium' | 'high' | null;
	labels: string[];
}

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

function fallback(transcript: string): ParseResult {
	return { title: transcript.trim() || 'Sprachaufgabe', dueDate: null, priority: null, labels: [] };
}

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

/**
 * Words that signal "the user actually mentioned a time-anchor".
 * We use this to override the LLM when it hallucinates a dueDate from
 * a transcript that has no date words at all — gemma3:4b is stubborn
 * about defaulting to today even when the prompt explicitly says null.
 *
 * Match is substring-based on the lowercased transcript, so we catch
 * "morgens" via "morgen", "heutzutage" via "heut", etc. False positives
 * are preferable to false negatives here: if we let through a
 * transcript with no real date, the user gets an unwanted dueDate;
 * if we suppress the LLM on a transcript that DOES have a date, the
 * user just sees no date and can fix it in two clicks.
 */
const DATE_TRIGGER_PATTERNS = [
	// German
	'heut',
	'morgen',
	'übermorgen',
	'gestern',
	'montag',
	'dienstag',
	'mittwoch',
	'donnerstag',
	'freitag',
	'samstag',
	'sonntag',
	'wochenende',
	'nächste',
	'nachste',
	'kommende',
	'in einer woche',
	'in zwei',
	'in drei',
	'in einem monat',
	'um ',
	'uhr',
	' am ',
	// English
	'today',
	'tomorrow',
	'yesterday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
	'weekend',
	'next ',
	'in a week',
	'in two ',
	'in three ',
	'at ',
	'pm',
	'am ',
	'tonight',
];

const PRIORITY_TRIGGER_PATTERNS = [
	// German
	'dringend',
	'wichtig',
	'unbedingt',
	'sofort',
	'asap',
	'kann warten',
	'eilt',
	'priorität',
	// English
	'urgent',
	'important',
	'immediately',
	'critical',
	'low priority',
	'high priority',
	'whenever',
];

/** Exported for unit tests. */
export function transcriptMentions(transcript: string, patterns: string[]): boolean {
	const lower = transcript.toLowerCase();
	return patterns.some((p) => lower.includes(p));
}

/** Exported for unit tests. */
export const __test = { DATE_TRIGGER_PATTERNS, PRIORITY_TRIGGER_PATTERNS };

/** Exported for unit tests. */
export function coerce(raw: unknown, transcript: string): ParseResult {
	if (!raw || typeof raw !== 'object') return fallback(transcript);
	const r = raw as Record<string, unknown>;
	const title = typeof r.title === 'string' && r.title.trim() ? r.title.trim() : transcript.trim();

	// Strict YYYY-MM-DD only — strip any time component the model adds
	// ("2026-04-09T14:00:00" → "2026-04-09"). Reject anything that
	// doesn't start with a 10-char ISO date.
	let dueDate: string | null = null;
	if (typeof r.dueDate === 'string') {
		const m = r.dueDate.match(/^(\d{4}-\d{2}-\d{2})/);
		if (m) dueDate = m[1];
	}
	// Override: if the transcript has zero date trigger words, the
	// LLM hallucinated a dueDate. Drop it. This guard exists because
	// gemma3:4b consistently emits today's date for plain tasks like
	// "Mülltonnen rausstellen" no matter how loudly the prompt says
	// "null when no date is mentioned".
	if (dueDate && !transcriptMentions(transcript, DATE_TRIGGER_PATTERNS)) {
		dueDate = null;
	}

	let priority: 'low' | 'medium' | 'high' | null = null;
	if (r.priority === 'low' || r.priority === 'medium' || r.priority === 'high') {
		priority = r.priority;
	}
	// Same hallucination guard for priority — neutral transcripts
	// shouldn't end up "high" because the model thinks taxes are
	// inherently urgent.
	if (priority && !transcriptMentions(transcript, PRIORITY_TRIGGER_PATTERNS)) {
		priority = null;
	}

	const labels = Array.isArray(r.labels)
		? r.labels.filter((l): l is string => typeof l === 'string').slice(0, 3)
		: [];
	return { title, dueDate, priority, labels };
}

function extractJson(text: string): unknown {
	// Models sometimes wrap JSON in ```json ... ``` even when told not to;
	// strip a fenced block if present, then take the first {...} run.
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
