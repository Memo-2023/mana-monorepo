/**
 * Mana LLM model aliases — single source of truth for which class of
 * model each backend feature uses.
 *
 * Resolved server-side by mana-llm via `services/mana-llm/aliases.yaml`;
 * consumers don't see the underlying provider/model unless they really
 * need to (mainly for token-cost accounting via the
 * `X-Mana-LLM-Resolved` response header).
 *
 * Plan: docs/plans/llm-fallback-aliases.md.
 */
export const MANA_LLM = {
	/** Short answers, classification, single-shot Q&A. Cheap class. */
	FAST_TEXT: 'mana/fast-text',
	/** Writing, essays, stories, longer prose. */
	LONG_FORM: 'mana/long-form',
	/** JSON output (comic storyboards, research subqueries, voice-intent parsing). */
	STRUCTURED: 'mana/structured',
	/** Agent missions, tool calls, multi-step plans. */
	REASONING: 'mana/reasoning',
	/** Multimodal (image + text). */
	VISION: 'mana/vision',
} as const;

export type ManaLlmAlias = (typeof MANA_LLM)[keyof typeof MANA_LLM];
