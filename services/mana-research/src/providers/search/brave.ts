/**
 * Brave Search API provider.
 * Docs: https://api.search.brave.com/app/documentation/web-search/get-started
 *
 * Pay-per-use (Data for Search plan, $5 / 1k queries). Requires X-Subscription-Token header.
 */

import type { SearchProvider } from '@mana/shared-research';
import { ProviderError, ProviderNotConfiguredError } from '../../lib/errors';

interface BraveApiResponse {
	web?: {
		results?: Array<{
			url: string;
			title: string;
			description: string;
			age?: string;
			page_age?: string;
			profile?: { name?: string };
		}>;
	};
}

export function createBraveProvider(): SearchProvider {
	return {
		id: 'brave',
		requiresApiKey: true,
		capabilities: {
			webSearch: true,
			newsSearch: true,
		},
		async search(query, options, ctx) {
			if (!ctx.apiKey) throw new ProviderNotConfiguredError('brave');
			const t0 = performance.now();

			const params = new URLSearchParams({
				q: query,
				count: String(options.limit ?? 10),
			});
			if (options.language) params.set('search_lang', options.language.split('-')[0]);
			if (options.safeSearch !== undefined) {
				params.set('safesearch', ['off', 'moderate', 'strict'][options.safeSearch] || 'moderate');
			}

			const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
				headers: {
					Accept: 'application/json',
					'X-Subscription-Token': ctx.apiKey,
				},
				signal: ctx.signal,
			});

			if (!res.ok) {
				const body = await res.text().catch(() => '');
				throw new ProviderError('brave', `HTTP ${res.status} ${body.slice(0, 200)}`);
			}

			const data = (await res.json()) as BraveApiResponse;
			const webResults = data.web?.results ?? [];

			return {
				results: webResults.map((r) => ({
					url: r.url,
					title: r.title,
					snippet: r.description,
					publishedAt: r.page_age ?? r.age,
					author: r.profile?.name,
					providerRaw: r,
				})),
				rawLatencyMs: Math.round(performance.now() - t0),
			};
		},
	};
}
