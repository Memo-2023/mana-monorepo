/**
 * DuckDuckGo provider — uses DDG HTML search via the unofficial "html.duckduckgo.com"
 * endpoint. Zero-auth, zero-cost, but heavily rate-limited in practice.
 *
 * For Phase 1 we keep this minimal: good as a free fallback / sanity check.
 */

import type { SearchProvider, SearchHit } from '@mana/shared-research';
import { ProviderError } from '../../lib/errors';

interface DDGInstantAnswer {
	Heading?: string;
	Abstract?: string;
	AbstractURL?: string;
	RelatedTopics?: Array<{
		Text?: string;
		FirstURL?: string;
		Icon?: unknown;
	}>;
}

export function createDuckDuckGoProvider(): SearchProvider {
	return {
		id: 'duckduckgo',
		requiresApiKey: false,
		capabilities: {
			webSearch: true,
		},
		async search(query, options, ctx) {
			const t0 = performance.now();
			const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1`;
			const res = await fetch(url, {
				signal: ctx.signal,
				headers: { 'User-Agent': 'Mozilla/5.0 (mana-research)' },
			});
			if (!res.ok) {
				throw new ProviderError('duckduckgo', `HTTP ${res.status}`);
			}
			const data = (await res.json()) as DDGInstantAnswer;
			const hits: SearchHit[] = [];

			if (data.AbstractURL && data.Abstract) {
				hits.push({
					url: data.AbstractURL,
					title: data.Heading ?? query,
					snippet: data.Abstract,
					providerRaw: data,
				});
			}

			for (const topic of data.RelatedTopics ?? []) {
				if (!topic.FirstURL || !topic.Text) continue;
				hits.push({
					url: topic.FirstURL,
					title: topic.Text.slice(0, 80),
					snippet: topic.Text,
					providerRaw: topic,
				});
				if (hits.length >= (options.limit ?? 10)) break;
			}

			return {
				results: hits,
				rawLatencyMs: Math.round(performance.now() - t0),
			};
		},
	};
}
