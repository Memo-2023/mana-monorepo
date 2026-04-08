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
const DEFAULT_MODEL = 'ollama/gemma3:4b';

function fallback(transcript: string): ParseResult {
	return { title: transcript.trim() || 'Sprachaufgabe', dueDate: null, priority: null, labels: [] };
}

function buildPrompt(transcript: string, language: string): string {
	const today = new Date().toISOString().slice(0, 10);
	const langName = language === 'de' ? 'German' : language === 'en' ? 'English' : language;
	return [
		`You are a task parser. The user spoke a task in ${langName}.`,
		`Today is ${today}.`,
		'',
		'Extract the following fields and return ONLY a JSON object with these exact keys:',
		'  - title: short imperative title without filler words (string, required)',
		'  - dueDate: ISO date YYYY-MM-DD',
		'  - priority: "low" | "medium" | "high"',
		'  - labels: array of short topic labels (max 3, lowercase)',
		'',
		'Rules — read carefully, the model often gets these wrong:',
		'- dueDate: ONLY set this when the transcript explicitly mentions a',
		'  date, weekday, or relative time word ("morgen", "tomorrow",',
		'  "nächsten Montag", "heute Abend", "in zwei Wochen"). For a bare',
		'  task like "Mülltonnen rausstellen" with no time at all, dueDate',
		'  MUST be null. Never default to today just because the task feels',
		'  like a today-thing.',
		'- priority: ONLY set this when the transcript uses urgency or',
		'  importance words ("dringend", "wichtig", "unbedingt", "asap",',
		'  "low priority", "kann warten"). For a neutral task, priority',
		'  MUST be null. Never guess from the topic.',
		'- labels: ONLY include labels that come directly from concrete',
		'  topic words in the transcript. For "Mülltonnen rausstellen",',
		'  "müll" is fine but "haushalt" is a stretch — when in doubt,',
		'  empty array. Max 3 labels, single words preferred.',
		'- Resolve relative dates against today for the dueDate field.',
		'- If only a time is mentioned (e.g. "um 14 Uhr"), assume today.',
		'- title: a short imperative ("Steuererklärung machen", not',
		'  "Erinnere mich an die Steuererklärung").',
		'- Output JSON only, no markdown, no commentary, no code fences.',
		'- Use null (literal, not the string "null") for absent fields.',
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

function transcriptMentions(transcript: string, patterns: string[]): boolean {
	const lower = transcript.toLowerCase();
	return patterns.some((p) => lower.includes(p));
}

function coerce(raw: unknown, transcript: string): ParseResult {
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
