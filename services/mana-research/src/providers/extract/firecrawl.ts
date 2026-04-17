/**
 * Firecrawl — Playwright-based JS rendering + LLM-friendly Markdown output.
 * Docs: https://docs.firecrawl.dev/api-reference/endpoint/scrape
 *
 * Pay-per-use credits. Self-hostable via Docker (then set FIRECRAWL_API_URL to
 * your own instance and any non-empty key works).
 */

import type { ExtractProvider } from '@mana/shared-research';
import { ProviderError, ProviderNotConfiguredError } from '../../lib/errors';

interface FirecrawlApiResponse {
	success: boolean;
	data?: {
		markdown?: string;
		html?: string;
		metadata?: {
			title?: string;
			description?: string;
			language?: string;
			sourceURL?: string;
			author?: string;
			publishedTime?: string;
			ogSiteName?: string;
		};
	};
	error?: string;
}

export function createFirecrawlProvider(apiUrl = 'https://api.firecrawl.dev'): ExtractProvider {
	return {
		id: 'firecrawl',
		requiresApiKey: true,
		capabilities: {
			jsRendering: true,
			pdfSupport: true,
			markdownOutput: true,
		},
		async extract(url, options, ctx) {
			if (!ctx.apiKey) throw new ProviderNotConfiguredError('firecrawl');
			const t0 = performance.now();

			const res = await fetch(`${apiUrl}/v1/scrape`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${ctx.apiKey}`,
				},
				body: JSON.stringify({
					url,
					formats: ['markdown'],
					onlyMainContent: true,
					timeout: options.timeoutMs ?? 30000,
				}),
				signal: ctx.signal,
			});

			if (!res.ok) {
				const body = await res.text().catch(() => '');
				throw new ProviderError('firecrawl', `HTTP ${res.status} ${body.slice(0, 200)}`);
			}

			const data = (await res.json()) as FirecrawlApiResponse;
			if (!data.success || !data.data) {
				throw new ProviderError('firecrawl', data.error ?? 'extraction failed');
			}

			const md = (data.data.markdown ?? '').slice(0, options.maxLength ?? 50000);
			const meta = data.data.metadata ?? {};
			return {
				content: {
					url: meta.sourceURL ?? url,
					title: meta.title ?? '',
					content: md,
					excerpt: meta.description,
					author: meta.author,
					siteName: meta.ogSiteName,
					publishedAt: meta.publishedTime,
					wordCount: md.split(/\s+/).filter(Boolean).length,
					providerRaw: data,
				},
				rawLatencyMs: Math.round(performance.now() - t0),
			};
		},
	};
}
