/**
 * Readability Extract Provider — wraps mana-search /api/v1/extract (go-readability).
 * Free (self-hosted), no JS rendering. Good baseline for simple HTML.
 */

import type { ExtractProvider } from '@mana/shared-research';
import { ProviderError } from '../../lib/errors';
import type { ManaSearchClient } from '../../clients/mana-search';

export function createReadabilityProvider(client: ManaSearchClient): ExtractProvider {
	return {
		id: 'readability',
		requiresApiKey: false,
		capabilities: {
			jsRendering: false,
			pdfSupport: false,
			markdownOutput: true,
		},
		async extract(url, options, ctx) {
			const t0 = performance.now();
			const res = await client.extract(url, { maxLength: options.maxLength, signal: ctx.signal });

			if (!res.success || !res.content) {
				throw new ProviderError('readability', 'extraction failed');
			}

			const c = res.content;
			return {
				content: {
					url,
					title: c.title,
					content: c.markdown ?? c.text,
					author: c.author,
					siteName: c.siteName,
					publishedAt: c.publishedDate,
					wordCount: c.wordCount,
					providerRaw: res,
				},
				rawLatencyMs: Math.round(performance.now() - t0),
			};
		},
	};
}
