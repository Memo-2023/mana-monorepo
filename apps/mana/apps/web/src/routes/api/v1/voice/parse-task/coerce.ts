/**
 * Pure helpers for /api/v1/voice/parse-task.
 *
 * Lives next to +server.ts (rather than inside it) because SvelteKit's
 * production build forbids non-handler exports from a +server file —
 * dev runs them fine, but `pnpm build` errors out with
 *   "Invalid export 'coerce' in /api/v1/voice/parse-task"
 * for anything that isn't a request method or starts with `_`. Putting
 * the helpers here keeps both the route file clean and the unit tests
 * importing-from-a-real-module instead of from a route handler.
 */

export interface ParseResult {
	title: string;
	dueDate: string | null; // ISO date (YYYY-MM-DD) or null
	priority: 'low' | 'medium' | 'high' | null;
	labels: string[];
}

export function fallback(transcript: string): ParseResult {
	return {
		title: transcript.trim() || 'Sprachaufgabe',
		dueDate: null,
		priority: null,
		labels: [],
	};
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
export const DATE_TRIGGER_PATTERNS = [
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

export const PRIORITY_TRIGGER_PATTERNS = [
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

export function transcriptMentions(transcript: string, patterns: string[]): boolean {
	const lower = transcript.toLowerCase();
	return patterns.some((p) => lower.includes(p));
}

/**
 * Coerce an LLM response into a ParseResult, applying the
 * deterministic guards that catch the gemma3 hallucination failure
 * modes (today's-date stamping on bare tasks, fake priorities,
 * malformed date strings, non-array label payloads).
 */
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

/**
 * Extract a JSON object from a model response. gemma3 sometimes wraps
 * its output in ```json ... ``` fences even when told not to; we strip
 * those, then take the first {...} run we find.
 */
export function extractJson(text: string): unknown {
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
