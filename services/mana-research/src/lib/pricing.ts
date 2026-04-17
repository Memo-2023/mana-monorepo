/**
 * Provider pricing in credits. 1 credit ≈ 1 cent EUR (matches mana-credits).
 *
 * Keep in sync with docs/plans/mana-research-service.md §2. Review quarterly.
 * Prices as of 2026-04-17.
 */

import type { ProviderId } from '@mana/shared-research';

export const PROVIDER_PRICING: Record<
	ProviderId,
	{ search?: number; extract?: number; research?: number }
> = {
	// Search providers
	searxng: { search: 0 },
	duckduckgo: { search: 0 },
	brave: { search: 5 },
	tavily: { search: 8 },
	exa: { search: 6 },
	serper: { search: 1 },

	// Extract providers
	readability: { extract: 0 },
	'jina-reader': { extract: 1 },
	firecrawl: { extract: 10 },
	scrapingbee: { extract: 8 },

	// Research agents
	'perplexity-sonar': { research: 50 },
	'claude-web-search': { research: 200 },
	'openai-responses': { research: 200 },
	'gemini-grounding': { research: 100 },
	'openai-deep-research': { research: 1000 },
};

export function priceFor(
	providerId: ProviderId,
	operation: 'search' | 'extract' | 'research'
): number {
	const entry = PROVIDER_PRICING[providerId];
	return entry?.[operation] ?? 0;
}
