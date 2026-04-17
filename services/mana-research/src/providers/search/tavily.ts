/**
 * Tavily Search API — optimized for LLM agents. Returns extracted content
 * alongside links, which is why we map it to `content` on SearchHit.
 *
 * Docs: https://docs.tavily.com/docs/rest-api/api-reference
 * Billing: credit-packs (pay-per-use, no subscription lock-in).
 */

import type { SearchProvider } from '@mana/shared-research';
import { ProviderError, ProviderNotConfiguredError } from '../../lib/errors';

interface TavilyApiResponse {
	query: string;
	answer?: string;
	results: Array<{
		url: string;
		title: string;
		content: string;
		score: number;
		published_date?: string;
	}>;
}

export function createTavilyProvider(): SearchProvider {
	return {
		id: 'tavily',
		requiresApiKey: true,
		capabilities: {
			webSearch: true,
			newsSearch: true,
			contentInResults: true,
		},
		async search(query, options, ctx) {
			if (!ctx.apiKey) throw new ProviderNotConfiguredError('tavily');
			const t0 = performance.now();

			const topic = options.categories?.includes('news') ? 'news' : 'general';
			const maxResults = Math.min(options.limit ?? 10, 20);

			const res = await fetch('https://api.tavily.com/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					api_key: ctx.apiKey,
					query,
					topic,
					max_results: maxResults,
					include_answer: false,
					search_depth: 'basic',
				}),
				signal: ctx.signal,
			});

			if (!res.ok) {
				const body = await res.text().catch(() => '');
				throw new ProviderError('tavily', `HTTP ${res.status} ${body.slice(0, 200)}`);
			}

			const data = (await res.json()) as TavilyApiResponse;

			return {
				results: data.results.map((r) => ({
					url: r.url,
					title: r.title,
					snippet: r.content.slice(0, 300),
					content: r.content,
					publishedAt: r.published_date,
					score: r.score,
					providerRaw: r,
				})),
				rawLatencyMs: Math.round(performance.now() - t0),
			};
		},
	};
}
