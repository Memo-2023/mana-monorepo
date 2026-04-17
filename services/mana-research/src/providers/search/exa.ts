/**
 * Exa (formerly Metaphor) — semantic/neural search.
 * Docs: https://docs.exa.ai/reference/search
 *
 * Best for "find similar to this", academic papers, long-tail technical queries.
 * Pay-per-use, ~$0.001–0.01/query depending on options.
 */

import type { SearchProvider } from '@mana/shared-research';
import { ProviderError, ProviderNotConfiguredError } from '../../lib/errors';

interface ExaApiResponse {
	results: Array<{
		id: string;
		url: string;
		title: string;
		publishedDate?: string;
		author?: string;
		score?: number;
		text?: string;
	}>;
}

export function createExaProvider(): SearchProvider {
	return {
		id: 'exa',
		requiresApiKey: true,
		capabilities: {
			webSearch: true,
			semanticSearch: true,
			scholarSearch: true,
			contentInResults: true,
		},
		async search(query, options, ctx) {
			if (!ctx.apiKey) throw new ProviderNotConfiguredError('exa');
			const t0 = performance.now();

			const res = await fetch('https://api.exa.ai/search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': ctx.apiKey,
				},
				body: JSON.stringify({
					query,
					numResults: Math.min(options.limit ?? 10, 25),
					type: 'neural',
					useAutoprompt: true,
					contents: { text: { maxCharacters: 2000 } },
				}),
				signal: ctx.signal,
			});

			if (!res.ok) {
				const body = await res.text().catch(() => '');
				throw new ProviderError('exa', `HTTP ${res.status} ${body.slice(0, 200)}`);
			}

			const data = (await res.json()) as ExaApiResponse;

			return {
				results: data.results.map((r) => ({
					url: r.url,
					title: r.title,
					snippet: r.text?.slice(0, 300) ?? '',
					content: r.text,
					publishedAt: r.publishedDate,
					author: r.author,
					score: r.score,
					providerRaw: r,
				})),
				rawLatencyMs: Math.round(performance.now() - t0),
			};
		},
	};
}
