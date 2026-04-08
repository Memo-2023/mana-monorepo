/**
 * extractDateTask — pulls an ISO date out of a free-form German/English
 * string. Used by Quick-Add features that want to recognize phrases like
 * "morgen 14 Uhr" or "next Tuesday".
 *
 * Has a runRules() fallback so it works even on Tier 0 (no AI) — the
 * fallback uses a hand-rolled regex set covering the most common
 * shortcuts. It's intentionally narrow: it only catches the patterns it
 * KNOWS, and returns null otherwise. This is the right semantic for
 * Tier 0 — "I'm not certain enough to guess" is a valid answer when
 * the user has explicitly opted out of LLM use.
 *
 * For production-grade NL date parsing without an LLM, replacing the
 * regex stub with chrono-node would be a one-line change in runRules().
 */

import type { LlmBackend, LlmTask } from '@mana/shared-llm';

export interface ExtractDateInput {
	text: string;
	/** Reference date for relative parsing ("morgen", "next week"). Defaults to now. */
	now?: Date;
}

export type ExtractDateOutput = Date | null;

export const extractDateTask: LlmTask<ExtractDateInput, ExtractDateOutput> = {
	name: 'common.extractDate',
	minTier: 'none', // works on Tier 0 thanks to the regex fallback
	contentClass: 'personal',
	displayLabel: 'Datum aus Text erkennen',

	async runLlm(input, backend: LlmBackend): Promise<ExtractDateOutput> {
		const refIso = (input.now ?? new Date()).toISOString();
		const result = await backend.generate({
			taskName: extractDateTask.name,
			contentClass: extractDateTask.contentClass,
			messages: [
				{
					role: 'system',
					content:
						'You extract date+time references from short user input. Always respond with strict JSON of the form {"iso":"YYYY-MM-DDTHH:MM:SSZ"} or {"iso":null}. No prose, no markdown.',
				},
				{
					role: 'user',
					content: `Reference time: ${refIso}\nUser input: ${input.text}`,
				},
			],
			temperature: 0,
			maxTokens: 80,
		});

		try {
			// Strip markdown fences if a less-disciplined model added them
			const cleaned = result.content.replace(/```(?:json)?|```/g, '').trim();
			const parsed = JSON.parse(cleaned) as { iso: string | null };
			return parsed.iso ? new Date(parsed.iso) : null;
		} catch {
			return null;
		}
	},

	async runRules(input): Promise<ExtractDateOutput> {
		const text = input.text.toLowerCase().trim();
		const now = input.now ?? new Date();

		// "heute" / "today"
		if (/\b(heute|today)\b/.test(text)) {
			return withTime(new Date(now), text);
		}

		// "morgen" / "tomorrow"
		if (/\b(morgen|tomorrow)\b/.test(text)) {
			const d = new Date(now);
			d.setDate(d.getDate() + 1);
			return withTime(d, text);
		}

		// "übermorgen" / "day after tomorrow"
		if (/\b(übermorgen|day after tomorrow)\b/.test(text)) {
			const d = new Date(now);
			d.setDate(d.getDate() + 2);
			return withTime(d, text);
		}

		// "in N tagen" / "in N days"
		const inDays = text.match(/\bin (\d+) (tagen|days?)\b/);
		if (inDays) {
			const d = new Date(now);
			d.setDate(d.getDate() + parseInt(inDays[1], 10));
			return withTime(d, text);
		}

		// Explicit ISO date "2026-04-09" or "2026-04-09T14:00"
		const iso = text.match(/(\d{4}-\d{2}-\d{2}(?:t\d{2}:\d{2}(?::\d{2})?)?)/);
		if (iso) {
			const d = new Date(iso[1]);
			if (!Number.isNaN(d.getTime())) return d;
		}

		return null;
	},
};

/** Apply a "HH:MM" or "HH Uhr" time hint to a date if found in the text. */
function withTime(date: Date, text: string): Date {
	const hhmm = text.match(/\b(\d{1,2}):(\d{2})\b/);
	if (hhmm) {
		date.setHours(parseInt(hhmm[1], 10), parseInt(hhmm[2], 10), 0, 0);
		return date;
	}
	const hhUhr = text.match(/\b(\d{1,2})\s*uhr\b/);
	if (hhUhr) {
		date.setHours(parseInt(hhUhr[1], 10), 0, 0, 0);
		return date;
	}
	// No time hint — keep the original time-of-day
	return date;
}
