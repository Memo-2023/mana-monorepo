export const SEARCH_PROVIDER_IDS = [
	'searxng',
	'brave',
	'tavily',
	'exa',
	'serper',
	'duckduckgo',
] as const;

export const EXTRACT_PROVIDER_IDS = [
	'readability',
	'jina-reader',
	'firecrawl',
	'scrapingbee',
] as const;

export const AGENT_PROVIDER_IDS = [
	'perplexity-sonar',
	'claude-web-search',
	'openai-responses',
	'gemini-grounding',
	'openai-deep-research',
	'gemini-deep-research',
	'gemini-deep-research-max',
] as const;

export type SearchProviderId = (typeof SEARCH_PROVIDER_IDS)[number];
export type ExtractProviderId = (typeof EXTRACT_PROVIDER_IDS)[number];
export type AgentProviderId = (typeof AGENT_PROVIDER_IDS)[number];
export type ProviderId = SearchProviderId | ExtractProviderId | AgentProviderId;

export type ProviderCategory = 'search' | 'extract' | 'agent';

export type BillingMode = 'server-key' | 'byo-key' | 'free';

export function providerCategory(id: ProviderId): ProviderCategory {
	if ((SEARCH_PROVIDER_IDS as readonly string[]).includes(id)) return 'search';
	if ((EXTRACT_PROVIDER_IDS as readonly string[]).includes(id)) return 'extract';
	return 'agent';
}
