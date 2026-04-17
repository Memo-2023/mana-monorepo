/**
 * Provider registry — maps provider IDs to their instances + metadata.
 */

import type {
	AgentProviderId,
	ExtractProvider,
	ExtractProviderId,
	ProviderId,
	ResearchAgent,
	SearchProvider,
	SearchProviderId,
} from '@mana/shared-research';
import { BadRequestError } from '../lib/errors';
import type { ManaSearchClient } from '../clients/mana-search';
import { createBraveProvider } from './search/brave';
import { createDuckDuckGoProvider } from './search/duckduckgo';
import { createExaProvider } from './search/exa';
import { createSearxngProvider } from './search/searxng';
import { createSerperProvider } from './search/serper';
import { createTavilyProvider } from './search/tavily';
import { createFirecrawlProvider } from './extract/firecrawl';
import { createJinaReaderProvider } from './extract/jina-reader';
import { createReadabilityProvider } from './extract/readability';
import { createPerplexitySonarProvider } from './agent/perplexity-sonar';
import { createClaudeWebSearchProvider } from './agent/claude-web-search';
import { createOpenAIResponsesProvider } from './agent/openai-responses';
import { createGeminiGroundingProvider } from './agent/gemini-grounding';

export interface ProviderRegistry {
	search: Map<SearchProviderId, SearchProvider>;
	extract: Map<ExtractProviderId, ExtractProvider>;
	agent: Map<AgentProviderId, ResearchAgent>;
}

export function buildRegistry(deps: { manaSearch: ManaSearchClient }): ProviderRegistry {
	const search = new Map<SearchProviderId, SearchProvider>();
	search.set('searxng', createSearxngProvider(deps.manaSearch));
	search.set('duckduckgo', createDuckDuckGoProvider());
	search.set('brave', createBraveProvider());
	search.set('tavily', createTavilyProvider());
	search.set('exa', createExaProvider());
	search.set('serper', createSerperProvider());

	const extract = new Map<ExtractProviderId, ExtractProvider>();
	extract.set('readability', createReadabilityProvider(deps.manaSearch));
	extract.set('jina-reader', createJinaReaderProvider());
	extract.set('firecrawl', createFirecrawlProvider());

	const agent = new Map<AgentProviderId, ResearchAgent>();
	agent.set('perplexity-sonar', createPerplexitySonarProvider());
	agent.set('claude-web-search', createClaudeWebSearchProvider());
	agent.set('openai-responses', createOpenAIResponsesProvider());
	agent.set('gemini-grounding', createGeminiGroundingProvider());

	return { search, extract, agent };
}

export function getSearchProvider(registry: ProviderRegistry, id: string): SearchProvider {
	const provider = registry.search.get(id as SearchProviderId);
	if (!provider) {
		throw new BadRequestError(`Unknown search provider: ${id}`, {
			available: [...registry.search.keys()],
		});
	}
	return provider;
}

export function getExtractProvider(registry: ProviderRegistry, id: string): ExtractProvider {
	const provider = registry.extract.get(id as ExtractProviderId);
	if (!provider) {
		throw new BadRequestError(`Unknown extract provider: ${id}`, {
			available: [...registry.extract.keys()],
		});
	}
	return provider;
}

export function getAgent(registry: ProviderRegistry, id: string): ResearchAgent {
	const provider = registry.agent.get(id as AgentProviderId);
	if (!provider) {
		throw new BadRequestError(`Unknown research agent: ${id}`, {
			available: [...registry.agent.keys()],
		});
	}
	return provider;
}

export function listProviders(registry: ProviderRegistry) {
	return {
		search: [...registry.search.values()].map((p) => ({
			id: p.id,
			category: 'search' as const,
			requiresApiKey: p.requiresApiKey,
			capabilities: p.capabilities,
		})),
		extract: [...registry.extract.values()].map((p) => ({
			id: p.id,
			category: 'extract' as const,
			requiresApiKey: p.requiresApiKey,
			capabilities: p.capabilities,
		})),
		agent: [...registry.agent.values()].map((p) => ({
			id: p.id,
			category: 'agent' as const,
			requiresApiKey: p.requiresApiKey,
			capabilities: p.capabilities,
		})),
	};
}

export type { ProviderId };
