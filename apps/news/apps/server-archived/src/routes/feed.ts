import { Hono } from 'hono';
import type { FeedService } from '../services/feed';

export function createFeedRoutes(feedService: FeedService) {
	return new Hono()
		.get('/', async (c) => {
			const type = c.req.query('type');
			const categoryId = c.req.query('categoryId');
			const limit = parseInt(c.req.query('limit') || '20', 10);
			const offset = parseInt(c.req.query('offset') || '0', 10);

			const articles = await feedService.getArticles({ type, categoryId, limit, offset });
			return c.json(articles);
		})
		.get('/:id', async (c) => {
			const id = c.req.param('id');
			const article = await feedService.getArticleById(id);
			if (!article) return c.json({ error: 'Article not found' }, 404);
			return c.json(article);
		});
}
