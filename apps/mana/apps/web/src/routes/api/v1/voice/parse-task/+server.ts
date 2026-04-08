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
		'  - dueDate: ISO date YYYY-MM-DD or null if no date is mentioned',
		'  - priority: "low" | "medium" | "high" | null',
		'  - labels: array of short topic labels (max 3, lowercase, may be empty)',
		'',
		'Rules:',
		'- Resolve relative dates ("morgen", "tomorrow", "nächsten Montag") against today.',
		'- If only a time is mentioned, assume today.',
		'- Never invent details. If unsure, use null / empty array.',
		'- Output JSON only, no markdown, no commentary, no code fences.',
		'',
		`Transcript: ${JSON.stringify(transcript)}`,
	].join('\n');
}

function coerce(raw: unknown, transcript: string): ParseResult {
	if (!raw || typeof raw !== 'object') return fallback(transcript);
	const r = raw as Record<string, unknown>;
	const title = typeof r.title === 'string' && r.title.trim() ? r.title.trim() : transcript.trim();
	const dueDate =
		typeof r.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(r.dueDate) ? r.dueDate : null;
	const priority =
		r.priority === 'low' || r.priority === 'medium' || r.priority === 'high' ? r.priority : null;
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

	let response: Response;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
	try {
		response = await fetch(`${llmUrl.replace(/\/$/, '')}/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
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
