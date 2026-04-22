/**
 * GET /v1/providers         — registered providers with capabilities + pricing
 * GET /v1/providers/health  — which providers are currently usable (key present)
 */

import { Hono } from 'hono';
import type { ProviderRegistry } from '../providers/registry';
import { listProviders } from '../providers/registry';
import { PROVIDER_PRICING } from '../lib/pricing';
import type { Config } from '../config';

export function createProvidersRoutes(registry: ProviderRegistry, config: Config) {
	return new Hono()
		.get('/', (c) => {
			const list = listProviders(registry);
			return c.json({
				search: list.search.map((p) => ({ ...p, pricing: PROVIDER_PRICING[p.id] })),
				extract: list.extract.map((p) => ({ ...p, pricing: PROVIDER_PRICING[p.id] })),
				agent: list.agent.map((p) => ({ ...p, pricing: PROVIDER_PRICING[p.id] })),
			});
		})
		.get('/health', (c) => {
			const keys = config.providerKeys;
			type Entry = {
				id: string;
				category: 'search' | 'extract' | 'agent';
				requiresApiKey: boolean;
				serverKeyAvailable: boolean;
				status: 'ready' | 'needs-key' | 'free';
			};

			const check = (
				id: string,
				requiresKey: boolean,
				serverKeyPresent: boolean
			): Entry['status'] => {
				if (!requiresKey) return 'free';
				return serverKeyPresent ? 'ready' : 'needs-key';
			};

			const keyMap: Record<string, boolean> = {
				brave: !!keys.brave,
				tavily: !!keys.tavily,
				exa: !!keys.exa,
				serper: !!keys.serper,
				'jina-reader': !!keys.jina,
				firecrawl: !!keys.firecrawl,
				scrapingbee: !!keys.scrapingbee,
				'perplexity-sonar': !!keys.perplexity,
				'claude-web-search': !!keys.anthropic,
				'openai-responses': !!keys.openai,
				'openai-deep-research': !!keys.openai,
				'gemini-grounding': !!keys.googleGenai,
				'gemini-deep-research': !!keys.googleGenai,
				'gemini-deep-research-max': !!keys.googleGenai,
			};

			const list = listProviders(registry);
			const entries: Entry[] = [
				...list.search.map((p) => ({
					id: p.id,
					category: 'search' as const,
					requiresApiKey: p.requiresApiKey,
					serverKeyAvailable: !!keyMap[p.id],
					status: check(p.id, p.requiresApiKey, !!keyMap[p.id]),
				})),
				...list.extract.map((p) => ({
					id: p.id,
					category: 'extract' as const,
					requiresApiKey: p.requiresApiKey,
					serverKeyAvailable: !!keyMap[p.id],
					status: check(p.id, p.requiresApiKey, !!keyMap[p.id]),
				})),
				...list.agent.map((p) => ({
					id: p.id,
					category: 'agent' as const,
					requiresApiKey: p.requiresApiKey,
					serverKeyAvailable: !!keyMap[p.id],
					status: check(p.id, p.requiresApiKey, !!keyMap[p.id]),
				})),
			];

			return c.json({
				providers: entries,
				summary: {
					ready: entries.filter((e) => e.status === 'ready' || e.status === 'free').length,
					total: entries.length,
				},
			});
		});
}
