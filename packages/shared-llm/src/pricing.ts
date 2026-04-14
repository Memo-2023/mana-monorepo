/**
 * Per-model token pricing for BYOK cost estimation.
 *
 * Values in USD per 1M tokens (as published by providers as of
 * 2026-04). Update manually when providers change pricing.
 *
 * Only includes models Mana exposes in the BYOK provider adapters.
 */

export interface ModelPricing {
	/** USD per 1 million input tokens */
	inputPerMillion: number;
	/** USD per 1 million output tokens */
	outputPerMillion: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
	// ── OpenAI ──────────────────────────────────────────
	'gpt-5': { inputPerMillion: 15, outputPerMillion: 60 },
	'gpt-5-mini': { inputPerMillion: 3, outputPerMillion: 12 },
	'gpt-4o': { inputPerMillion: 5, outputPerMillion: 20 },
	'gpt-4o-mini': { inputPerMillion: 0.3, outputPerMillion: 1.2 },
	'gpt-4-turbo': { inputPerMillion: 10, outputPerMillion: 30 },
	o1: { inputPerMillion: 15, outputPerMillion: 60 },
	'o1-mini': { inputPerMillion: 3, outputPerMillion: 12 },

	// ── Anthropic ───────────────────────────────────────
	'claude-opus-4-6': { inputPerMillion: 15, outputPerMillion: 75 },
	'claude-opus-4-5': { inputPerMillion: 15, outputPerMillion: 75 },
	'claude-sonnet-4-6': { inputPerMillion: 3, outputPerMillion: 15 },
	'claude-sonnet-4-5': { inputPerMillion: 3, outputPerMillion: 15 },
	'claude-haiku-4-5': { inputPerMillion: 0.8, outputPerMillion: 4 },

	// ── Google Gemini ───────────────────────────────────
	'gemini-2.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5 },
	'gemini-2.5-flash': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
	'gemini-2.5-flash-lite': { inputPerMillion: 0.075, outputPerMillion: 0.3 },
	'gemini-2.0-flash': { inputPerMillion: 0.1, outputPerMillion: 0.4 },

	// ── Mistral ─────────────────────────────────────────
	'mistral-large-latest': { inputPerMillion: 2, outputPerMillion: 6 },
	'mistral-medium-latest': { inputPerMillion: 2.7, outputPerMillion: 8.1 },
	'mistral-small-latest': { inputPerMillion: 0.2, outputPerMillion: 0.6 },
	'open-mistral-nemo': { inputPerMillion: 0.15, outputPerMillion: 0.15 },
	'codestral-latest': { inputPerMillion: 0.3, outputPerMillion: 0.9 },
};

/** USD cost for a given call. Returns 0 if model isn't in the table. */
export function estimateCost(
	model: string,
	promptTokens: number,
	completionTokens: number
): number {
	const p = MODEL_PRICING[model];
	if (!p) return 0;
	return (
		(promptTokens / 1_000_000) * p.inputPerMillion +
		(completionTokens / 1_000_000) * p.outputPerMillion
	);
}

/** Format USD value with at most 4 decimals (for small per-call amounts). */
export function formatCost(usd: number): string {
	if (usd === 0) return '—';
	if (usd < 0.0001) return '< $0.0001';
	if (usd < 0.01) return `$${usd.toFixed(4)}`;
	if (usd < 1) return `$${usd.toFixed(3)}`;
	return `$${usd.toFixed(2)}`;
}
