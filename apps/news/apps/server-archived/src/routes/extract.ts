import { Hono } from 'hono';
import type { ExtractService } from '../services/extract';
import type { AuthUser } from '../middleware/jwt-auth';
import { BadRequestError } from '../lib/errors';

export function createExtractRoutes(extractService: ExtractService) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.post('/preview', async (c) => {
			const { url } = await c.req.json<{ url: string }>();
			if (!url) throw new BadRequestError('URL is required');

			const article = await extractService.extractFromUrl(url);
			return c.json(article);
		})
		.post('/save', async (c) => {
			const { url } = await c.req.json<{ url: string }>();
			if (!url) throw new BadRequestError('URL is required');

			const extracted = await extractService.extractFromUrl(url);

			// Return extracted data — client saves to local-first store
			return c.json({
				id: crypto.randomUUID(),
				type: 'saved',
				sourceOrigin: 'user_saved',
				originalUrl: url,
				title: extracted.title,
				content: extracted.content,
				htmlContent: extracted.htmlContent,
				excerpt: extracted.excerpt,
				author: extracted.byline,
				siteName: extracted.siteName,
				wordCount: extracted.wordCount,
				readingTimeMinutes: extracted.readingTimeMinutes,
				isArchived: false,
			});
		});
}
