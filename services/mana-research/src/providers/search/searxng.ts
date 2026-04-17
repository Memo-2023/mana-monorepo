/**
 * SearXNG provider — wraps mana-search (Go service on port 3021).
 * Free, self-hosted, no API key. Always available.
 */

import type { SearchProvider } from '@mana/shared-research';
import type { ManaSearchClient } from '../../clients/mana-search';

export function createSearxngProvider(client: ManaSearchClient): SearchProvider {
	return {
		id: 'searxng',
		requiresApiKey: false,
		capabilities: {
			webSearch: true,
			newsSearch: true,
			scholarSearch: true,
		},
		async search(query, options, ctx) {
			const t0 = performance.now();
			const categoryMap: Record<string, string> = {
				general: 'general',
				news: 'news',
				science: 'science',
				it: 'it',
			};
			const categories = options.categories?.map((c) => categoryMap[c]).filter(Boolean);

			const res = await client.search(query, {
				limit: options.limit,
				categories,
				language: options.language,
				signal: ctx.signal,
			});

			return {
				results: res.results.map((r) => ({
					url: r.url,
					title: r.title,
					snippet: r.snippet,
					publishedAt: r.publishedDate,
					score: r.score,
					providerRaw: r,
				})),
				rawLatencyMs: Math.round(performance.now() - t0),
			};
		},
	};
}
