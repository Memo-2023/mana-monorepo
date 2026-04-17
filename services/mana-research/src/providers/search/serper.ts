/**
 * Serper — Google SERP as JSON.
 * Docs: https://serper.dev/
 *
 * Good for classic Google search coverage (incl. People Also Ask, Knowledge Panel).
 * $0.30–1 / 1k queries. Pay-per-use.
 */

import type { SearchProvider } from '@mana/shared-research';
import { ProviderError, ProviderNotConfiguredError } from '../../lib/errors';

interface SerperApiResponse {
	organic?: Array<{
		title: string;
		link: string;
		snippet: string;
		date?: string;
		position?: number;
	}>;
	answerBox?: {
		title?: string;
		answer?: string;
		snippet?: string;
		link?: string;
	};
}

export function createSerperProvider(): SearchProvider {
	return {
		id: 'serper',
		requiresApiKey: true,
		capabilities: {
			webSearch: true,
			newsSearch: true,
		},
		async search(query, options, ctx) {
			if (!ctx.apiKey) throw new ProviderNotConfiguredError('serper');
			const t0 = performance.now();

			const [gl, hl] = (options.language ?? 'de-DE').toLowerCase().split('-');

			const res = await fetch('https://google.serper.dev/search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-API-KEY': ctx.apiKey,
				},
				body: JSON.stringify({
					q: query,
					num: Math.min(options.limit ?? 10, 20),
					gl: hl || gl,
					hl: gl,
				}),
				signal: ctx.signal,
			});

			if (!res.ok) {
				const body = await res.text().catch(() => '');
				throw new ProviderError('serper', `HTTP ${res.status} ${body.slice(0, 200)}`);
			}

			const data = (await res.json()) as SerperApiResponse;
			const organic = data.organic ?? [];

			return {
				results: organic.map((r) => ({
					url: r.link,
					title: r.title,
					snippet: r.snippet,
					publishedAt: r.date,
					score: r.position ? 1 - r.position / 100 : undefined,
					providerRaw: r,
				})),
				rawLatencyMs: Math.round(performance.now() - t0),
			};
		},
	};
}
