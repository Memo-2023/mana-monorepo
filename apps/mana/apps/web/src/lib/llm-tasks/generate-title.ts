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

export const generateTitleTask: LlmTask<GenerateTitleInput, GenerateTitleOutput> = {
	name: 'common.generateTitle',
	minTier: 'none', // works on Tier 0 via the first-sentence heuristic
	contentClass: 'personal',
	displayLabel: 'Titel automatisch erzeugen',

	async runLlm(input, backend: LlmBackend): Promise<GenerateTitleOutput> {
		const maxWords = input.maxWords ?? 7;
		const language = input.language ?? 'de';
		const result = await backend.generate({
			taskName: generateTitleTask.name,
			contentClass: generateTitleTask.contentClass,
			messages: [
				{
					role: 'system',
					content: `Du erstellst kurze, aussagekräftige Titel (max. ${maxWords} Wörter) für Texte. Sprache: ${language}. Antworte AUSSCHLIESSLICH mit dem Titel — kein Markdown, keine Anführungszeichen, keine Vorrede, kein Punkt am Ende.`,
				},
				{
					role: 'user',
					content: input.text.slice(0, 4000), // cap context for speed
				},
			],
			temperature: 0.5,
			maxTokens: 32,
		});

		// Defensive: strip surrounding quotes / markdown / trailing dots in
		// case the model didn't fully respect the system prompt.
		return result.content
			.trim()
			.replace(/^["'`*_]+|["'`*_]+$/g, '')
			.replace(/\.+$/, '')
			.trim();
	},

	async runRules(input): Promise<GenerateTitleOutput> {
		const text = input.text.trim();
		if (!text) return 'Ohne Titel';

		// Take the first sentence — split on .!? or newline.
		const firstSentence = text.split(/[.!?\n]/)[0]?.trim() ?? text;

		// Cap at ~60 chars / maxWords words, whichever comes first.
		const maxWords = input.maxWords ?? 7;
		const words = firstSentence.split(/\s+/).slice(0, maxWords);
		let candidate = words.join(' ');

		if (candidate.length > 60) {
			candidate = candidate.slice(0, 57).trimEnd() + '…';
		}

		return candidate || 'Ohne Titel';
	},
};
