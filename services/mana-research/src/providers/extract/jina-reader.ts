/**
 * Jina Reader — `https://r.jina.ai/<url>` returns extracted Markdown.
 * Free tier: 1M tokens/month without key. Paid tier via `JINA_API_KEY` lifts rate limit.
 *
 * The service is markedly better than plain Readability on JS-heavy sites.
 */

import type { ExtractProvider } from '@mana/shared-research';
import { ProviderError } from '../../lib/errors';

export function createJinaReaderProvider(): ExtractProvider {
	return {
		id: 'jina-reader',
		requiresApiKey: false,
		capabilities: {
			jsRendering: true,
			pdfSupport: true,
			markdownOutput: true,
		},
		async extract(url, options, ctx) {
			const t0 = performance.now();
			const readerUrl = `https://r.jina.ai/${url}`;

			const headers: Record<string, string> = {
				Accept: 'application/json',
				'X-Return-Format': 'markdown',
			};
			if (ctx.apiKey) headers.Authorization = `Bearer ${ctx.apiKey}`;
			if (options.timeoutMs) headers['X-Timeout'] = String(Math.round(options.timeoutMs / 1000));

			const res = await fetch(readerUrl, { headers, signal: ctx.signal });

			if (!res.ok) {
				const body = await res.text().catch(() => '');
				throw new ProviderError('jina-reader', `HTTP ${res.status} ${body.slice(0, 200)}`);
			}

			type JinaResponse = {
				data?: {
					title?: string;
					url?: string;
					content?: string;
					description?: string;
					publishedTime?: string;
				};
			};
			const data = (await res.json()) as JinaResponse;
			const d = data.data ?? {};
			const content = (d.content ?? '').slice(0, options.maxLength ?? 50000);
			const wordCount = content.split(/\s+/).filter(Boolean).length;

			return {
				content: {
					url: d.url ?? url,
					title: d.title ?? '',
					content,
					excerpt: d.description,
					publishedAt: d.publishedTime,
					wordCount,
					providerRaw: data,
				},
				rawLatencyMs: Math.round(performance.now() - t0),
			};
		},
	};
}
