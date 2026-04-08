/**
 * Tier definitions for the Mana LLM orchestrator.
 *
 * Four tiers, ordered from most-private to least-private:
 *
 *   none        — Deterministic parsers / heuristics. No LLM at all.
 *                 Always available. Zero cost. Quality varies by task.
 *
 *   browser     — Gemma 4 E2B running in the user's browser via WebGPU
 *                 (@mana/local-llm). 100% on-device. Requires the
 *                 ~500 MB model to be downloaded once and ~2 GB VRAM.
 *
 *   mana-server — services/mana-llm + Ollama on our own infrastructure
 *                 (currently the Mac Mini, gemma3:4b by default).
 *                 Data leaves the device but stays in our control.
 *
 *   cloud       — services/mana-llm proxied to a third-party provider
 *                 (Google Gemini, configured via google_api_key in the
 *                 mana-llm service env). Data goes to the third party.
 *
 * The numeric rank is used by the orchestrator to compare a user's
 * preferred tier against a task's minimum tier ("can the user even
 * run this task?") and is the canonical sort order for the privacy
 * gradient.
 */

export type LlmTier = 'none' | 'browser' | 'mana-server' | 'cloud';

export const TIER_RANK: Record<LlmTier, number> = {
	none: 0,
	browser: 1,
	'mana-server': 2,
	cloud: 3,
};

export const ALL_TIERS: readonly LlmTier[] = ['none', 'browser', 'mana-server', 'cloud'];

/** Human-readable label, kept here so backends/UI agree on naming. */
export function tierLabel(tier: LlmTier): string {
	switch (tier) {
		case 'none':
			return 'Lokal (ohne KI)';
		case 'browser':
			return 'Auf deinem Gerät';
		case 'mana-server':
			return 'Mana-Server';
		case 'cloud':
			return 'Google Gemini';
	}
}
