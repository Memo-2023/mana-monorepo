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
	const allWords = firstSentence.split(/\s+/).filter(Boolean);
	const wordCount = allWords.length;

	// Short transcripts: a date label is more honest than echoing the
	// transcript back verbatim as if it were a title.
	if (wordCount <= 8) return dateLabel();

	// For longer transcripts, take the first N words. But: if the
	// extracted slice is clearly a sentence fragment (ends mid-word
	// rather than at a clause boundary like a comma) AND the original
	// transcript doesn't have an obvious topic-noun in the first 5
	// words, fall back to the date label. Sentence fragments like
	// "Eine kleine Testaufnahme um zu sehen ob" are worse than
	// "Memo vom 9. April 2026" — both convey nothing useful, but the
	// date is at least honest about being a placeholder.
	const maxWords = input.maxWords ?? 7;
	const slice = allWords.slice(0, maxWords);
	let candidate = slice.join(' ');

	// "Looks like a sentence fragment" heuristic:
	//   - the slice ends without a comma, period, colon, or
	//     conjunction-like word (so we know we cut mid-thought)
	//   - AND the slice contains a stop-word in the last position
	//     (typical of "und/oder/wenn/ob/zu/um/...")
	const lastWord = (slice[slice.length - 1] ?? '').toLowerCase();
	const fragmentStopWords = new Set([
		'und',
		'oder',
		'aber',
		'wenn',
		'ob',
		'um',
		'zu',
		'der',
		'die',
		'das',
		'ein',
		'eine',
		'einen',
		'mit',
		'für',
		'auf',
		'an',
		'in',
		'von',
		'bei',
		'nach',
		'vor',
		'noch',
		'auch',
		'ist',
		'sind',
		'war',
		'wurde',
		'hat',
		'haben',
		'wird',
		'werden',
	]);
	if (fragmentStopWords.has(lastWord)) {
		return dateLabel();
	}

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
		// Simple two-message prompt — system + user. The previous few-shot
		// prompt with three `Aufnahme: "..."\nTitel: ...` examples confused
		// Ollama gemma3:4b on the mana-server tier — it returned literal ""
		// for reasons we still don't fully understand (possibly chat-template
		// confusion with the embedded quotes / multi-section format). Keep
		// this minimal: one instruction, one input, one expected continuation.
		const result = await backend.generate({
			taskName: generateTitleTask.name,
			contentClass: generateTitleTask.contentClass,
			messages: [
				{
					role: 'system',
					content:
						'Du erzeugst einen kurzen Titel (3-5 Wörter) für eine Sprachnotiz. Antworte nur mit dem Titel, ohne Anführungszeichen, ohne Punkt, ohne Erklärung.',
				},
				{
					role: 'user',
					content: input.text.slice(0, 2000),
				},
			],
			temperature: 0.4,
			maxTokens: 32,
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
