/**
 * Auto-router — maps QueryType + available providers to an ordered preference
 * list. The first provider in the returned list that has a valid API key wins.
 */

import type { AgentProviderId, ExtractProviderId, SearchProviderId } from '@mana/shared-research';
import type { Config } from '../config';
import type { QueryType } from './classify';

export const SEARCH_ROUTE_MAP: Record<QueryType, SearchProviderId[]> = {
	news: ['tavily', 'brave', 'serper', 'searxng', 'duckduckgo'],
	general: ['brave', 'tavily', 'serper', 'searxng', 'duckduckgo'],
	semantic: ['exa', 'tavily', 'brave', 'searxng'],
	academic: ['exa', 'searxng', 'brave', 'tavily'],
	code: ['exa', 'serper', 'brave', 'searxng'],
	conversational: ['tavily', 'brave', 'serper', 'searxng'],
};

export const EXTRACT_ROUTE_DEFAULT: ExtractProviderId[] = [
	'firecrawl',
	'jina-reader',
	'readability',
];

/**
 * Pick the first provider in `preferences` that has a configured key (or
 * doesn't need one). Returns `null` if no provider is usable — caller should
 * fall back to free providers.
 */
export function pickSearchProvider(
	preferences: SearchProviderId[],
	config: Config,
	alwaysAvailable: Set<SearchProviderId> = new Set(['searxng', 'duckduckgo'])
): SearchProviderId | null {
	const envMap: Record<SearchProviderId, keyof Config['providerKeys'] | null> = {
		searxng: null,
		duckduckgo: null,
		brave: 'brave',
		tavily: 'tavily',
		exa: 'exa',
		serper: 'serper',
	};

	for (const id of preferences) {
		if (alwaysAvailable.has(id)) return id;
		const envKey = envMap[id];
		if (envKey && config.providerKeys[envKey]) return id;
	}
	return null;
}

export function pickExtractProvider(
	preferences: ExtractProviderId[],
	config: Config,
	alwaysAvailable: Set<ExtractProviderId> = new Set(['readability', 'jina-reader'])
): ExtractProviderId | null {
	const envMap: Record<ExtractProviderId, keyof Config['providerKeys'] | null> = {
		readability: null,
		'jina-reader': 'jina',
		firecrawl: 'firecrawl',
		scrapingbee: 'scrapingbee',
	};

	for (const id of preferences) {
		if (alwaysAvailable.has(id)) return id;
		const envKey = envMap[id];
		if (envKey && config.providerKeys[envKey]) return id;
	}
	return null;
}

/**
 * Preference order for agents when caller doesn't specify one. Cheaper +
 * fastest first, then better quality if keys are available.
 */
export const AGENT_DEFAULT_ORDER: AgentProviderId[] = [
	'perplexity-sonar', // best plug-and-play, moderate cost
	'gemini-grounding', // cheap with Google Search
	'openai-responses', // Responses API + web_search_preview
	'claude-web-search', // high quality, higher cost
	// Async agents (openai-deep-research, gemini-deep-research,
	// gemini-deep-research-max) are explicitly NOT in this list — they
	// run via /v1/research/async with its own dispatch.
];

export function pickAgent(config: Config): AgentProviderId | null {
	// Async agents (openai-deep-research, gemini-deep-research*) are only
	// reachable via POST /v1/research/async, so they are intentionally
	// absent from AGENT_DEFAULT_ORDER and therefore never auto-picked here.
	const envMap: Record<AgentProviderId, keyof Config['providerKeys']> = {
		'perplexity-sonar': 'perplexity',
		'claude-web-search': 'anthropic',
		'openai-responses': 'openai',
		'gemini-grounding': 'googleGenai',
		'openai-deep-research': 'openai',
		'gemini-deep-research': 'googleGenai',
		'gemini-deep-research-max': 'googleGenai',
	};
	for (const id of AGENT_DEFAULT_ORDER) {
		if (config.providerKeys[envMap[id]]) return id;
	}
	return null;
}
