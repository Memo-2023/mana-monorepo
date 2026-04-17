import type { ProviderId } from '@mana/shared-research';
import type { Config } from '../config';

/**
 * Maps a ProviderId to the corresponding env-key slot on Config.providerKeys.
 * Extract/agent providers that share a key with search (e.g. openai agents)
 * reuse the same slot.
 */
export function mapEnvKey(providerId: ProviderId): keyof Config['providerKeys'] {
	const map: Partial<Record<ProviderId, keyof Config['providerKeys']>> = {
		brave: 'brave',
		tavily: 'tavily',
		exa: 'exa',
		serper: 'serper',
		'perplexity-sonar': 'perplexity',
		'claude-web-search': 'anthropic',
		'openai-responses': 'openai',
		'openai-deep-research': 'openai',
		'gemini-grounding': 'googleGenai',
		'jina-reader': 'jina',
		firecrawl: 'firecrawl',
		scrapingbee: 'scrapingbee',
	};
	return map[providerId] ?? 'brave';
}
