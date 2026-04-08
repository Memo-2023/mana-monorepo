/**
 * summarizeTextTask — produces a short summary of a longer piece of
 * text. Used for things like dream entries, voice memo transcripts,
 * meeting notes.
 *
 * Has NO runRules() implementation: a meaningful summary genuinely
 * requires an LLM, and a fake "first sentence + ellipsis" fallback
 * would mislead the user. Tasks without a runRules forces the user
 * to actually pick a higher tier in settings — and the orchestrator's
 * canRun() will return false for them when they're on Tier 0.
 *
 * minTier is set to 'browser' rather than 'mana-server' because Gemma
 * 4 E2B handles short summarization tasks well in the browser. For
 * very long inputs (>4k tokens) the task could escalate to
 * mana-server via a per-task override.
 */

import type { LlmBackend, LlmTask } from '@mana/shared-llm';

export interface SummarizeInput {
	text: string;
	/** Approximate target length in sentences. Default 3. */
	sentences?: number;
}

export type SummarizeOutput = string;

export const summarizeTextTask: LlmTask<SummarizeInput, SummarizeOutput> = {
	name: 'common.summarize',
	minTier: 'browser', // genuinely needs an LLM — no rules-based equivalent
	contentClass: 'personal',
	displayLabel: 'Text zusammenfassen',

	async runLlm(input, backend: LlmBackend): Promise<SummarizeOutput> {
		const sentences = input.sentences ?? 3;
		const result = await backend.generate({
			taskName: summarizeTextTask.name,
			contentClass: summarizeTextTask.contentClass,
			messages: [
				{
					role: 'system',
					content: `Du fasst Text in ${sentences} prägnanten Sätzen zusammen. Behalte die wichtigsten Fakten und Beschlüsse, lasse Füller weg. Kein Markdown, keine Aufzählungen, keine Vorrede — nur die Zusammenfassung.`,
				},
				{ role: 'user', content: input.text },
			],
			temperature: 0.3,
			maxTokens: 500,
		});

		return result.content.trim();
	},

	// No runRules — this task is impossible without an LLM. The
	// orchestrator's canRun() will return false for users on Tier 0,
	// and modules using this task should hide their summarize button
	// when canRun() is false.
};
