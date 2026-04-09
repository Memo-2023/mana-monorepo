/**
 * generateTitleTask — produces a short title (3–7 words) for a longer
 * piece of text. Used by memoro to auto-name voice memos after STT
 * finishes, by notes for untitled drafts, by chat for thread names.
 *
 * Has a runRules() fallback so it works even on Tier 0: the fallback
 * takes the first sentence (or first ~60 chars), strips trailing
 * punctuation, and uses that as the title. It's not as nice as an
 * LLM-generated title but it's predictable, free, and never empty.
 */

import type { LlmBackend, LlmTask } from '@mana/shared-llm';

export interface GenerateTitleInput {
	text: string;
	/** Optional max title length in words. Default 7. */
	maxWords?: number;
	/** Optional language hint for the system prompt. Default 'de'. */
	language?: string;
}

export type GenerateTitleOutput = string;

/** Date-based fallback label, e.g. "Memo vom 9. April 2026". Used when
 *  the input is too short to produce a meaningful first-sentence title
 *  or when rulesImpl gets called on empty/garbled input. */
function dateLabel(): string {
	const today = new Date();
	const formatted = today.toLocaleDateString('de', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
	return `Memo vom ${formatted}`;
}

/** Deterministic first-sentence heuristic. Extracted to a module-scope
 *  function so runLlm can call it as a fallback when the LLM returns
 *  empty or whitespace-only output (which happens when the model emits
 *  only a `.` or special tokens that get stripped by skip_special_tokens).
 *
 *  For very short transcripts (≤8 words), the "first sentence" IS the
 *  whole transcript — using it as a title means the user sees their
 *  recording verbatim, which isn't a title. In that case fall through
 *  to the date label. The threshold is empirical: short voice memos
 *  benefit from a date marker, longer ones can spare a few words for
 *  a snippet. */
function rulesImpl(input: GenerateTitleInput): string {
	const text = input.text.trim();
	if (!text) return dateLabel();

	// Take the first sentence — split on .!? or newline.
	const firstSentence = text.split(/[.!?\n]/)[0]?.trim() ?? text;
	const wordCount = firstSentence.split(/\s+/).filter(Boolean).length;

	// Short transcripts: a date label is more honest than echoing the
	// transcript back verbatim as if it were a title.
	if (wordCount <= 8) return dateLabel();

	// Cap at ~60 chars / maxWords words, whichever comes first.
	const maxWords = input.maxWords ?? 7;
	const words = firstSentence.split(/\s+/).slice(0, maxWords);
	let candidate = words.join(' ');

	if (candidate.length > 60) {
		candidate = candidate.slice(0, 57).trimEnd() + '…';
	}

	return candidate || dateLabel();
}

export const generateTitleTask: LlmTask<GenerateTitleInput, GenerateTitleOutput> = {
	name: 'common.generateTitle',
	minTier: 'none', // works on Tier 0 via the first-sentence heuristic
	contentClass: 'personal',
	displayLabel: 'Titel automatisch erzeugen',

	async runLlm(input, backend: LlmBackend): Promise<GenerateTitleOutput> {
		// Few-shot prompt — small instruct models like Gemma 4 E2B respond
		// far better to "here's the pattern, complete the next one" than
		// to a list of negative constraints ("no markdown, no quotes, no
		// vorrede..."). The model just sees the structure and continues
		// it. Empirically this produces real titles instead of single
		// punctuation marks or empty special-token-only outputs.
		const userMessage = `Erstelle einen kurzen, aussagekräftigen Titel (3-5 Wörter) für die folgende Sprachaufnahme.

Beispiel 1:
Aufnahme: "Erinnere mich daran, morgen Vormittag den Müll rauszubringen, bevor die Müllabfuhr kommt."
Titel: Erinnerung Müll rausbringen

Beispiel 2:
Aufnahme: "Ich hatte heute eine Idee für die Präsentation nächste Woche, vielleicht sollten wir mit einer Demo anfangen statt mit Folien."
Titel: Idee Präsentation Demo-Start

Beispiel 3:
Aufnahme: "Notiz für mich, ich muss noch die Steuererklärung für 2025 fertig machen, Belege liegen schon im Ordner."
Titel: Steuererklärung 2025

Aufnahme: "${input.text.slice(0, 2000).replace(/"/g, "'")}"
Titel:`;

		const result = await backend.generate({
			taskName: generateTitleTask.name,
			contentClass: generateTitleTask.contentClass,
			messages: [{ role: 'user', content: userMessage }],
			temperature: 0.4,
			maxTokens: 24,
		});

		// Log the raw model output BEFORE cleanup so the next test
		// session can show us exactly what Gemma is producing if it
		// still misbehaves.
		console.info('[generateTitle] raw LLM output:', JSON.stringify(result.content));

		// Cleanup chain — but rolled back if any step would empty the
		// result. We'd rather keep a slightly imperfect title (with
		// quotes, with a trailing dot) than lose it entirely.
		const trimmed = result.content.trim();
		const stripFences = trimmed.split('\n')[0]?.trim() ?? trimmed; // first line only
		const stripQuotes = stripFences.replace(/^["'`*_]+|["'`*_]+$/g, '').trim();
		const stripDots = stripQuotes.replace(/\.+$/, '').trim();

		// Walk the chain and pick the first non-empty stage. This way
		// even if the model emits `"."` we still get something via the
		// trimmed stage; only if EVERY stage is empty do we fall through
		// to the rules implementation.
		const cleaned = stripDots || stripQuotes || stripFences || trimmed;

		if (!cleaned) {
			console.info(
				'[generateTitle] LLM returned empty after all cleanup stages, falling back to rules'
			);
			return rulesImpl(input);
		}

		return cleaned;
	},

	async runRules(input): Promise<GenerateTitleOutput> {
		return rulesImpl(input);
	},
};
