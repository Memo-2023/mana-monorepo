/**
 * Provider registry — maps provider IDs to their instances + metadata.
 */

import type {
	AgentProviderId,
	ExtractProvider,
	ExtractProviderId,
	ProviderId,
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

export interface ProviderRegistry {
	search: Map<SearchProviderId, SearchProvider>;
	extract: Map<ExtractProviderId, ExtractProvider>;
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

	return { search, extract };
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
		agent: [] as Array<{ id: AgentProviderId; category: 'agent'; requiresApiKey: boolean }>,
	};
}

export type { ProviderId };
