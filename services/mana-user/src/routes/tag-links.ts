import { Hono } from 'hono';
import type { TagsService } from '../services/tags';
import type { AuthUser } from '../middleware/jwt-auth';

export function createTagLinkRoutes(tagsService: TagsService) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.get('/entity', async (c) => {
			const user = c.get('user');
			const appId = c.req.query('appId') || '';
			const entityId = c.req.query('entityId') || '';
			const resolved = await tagsService.getLinksForEntity(user.userId, appId, entityId);
			return c.json(resolved);
		})
		.post('/', async (c) => {
			const user = c.get('user');
			const body = await c.req.json();
			const link = await tagsService.createLink(user.userId, body);
			return c.json(link, 201);
		})
		.post('/sync', async (c) => {
			const user = c.get('user');
			const { appId, entityId, entityType, tagIds } = await c.req.json();
			const result = await tagsService.syncLinks(user.userId, appId, entityId, entityType, tagIds);
			return c.json(result);
		})
		.get('/query', async (c) => {
			const user = c.get('user');
			const links = await tagsService.queryLinks(user.userId, {
				appId: c.req.query('appId'),
				entityId: c.req.query('entityId'),
				tagId: c.req.query('tagId'),
			});
			return c.json(links);
		})
		.delete('/:id', async (c) => {
			const user = c.get('user');
			await tagsService.deleteLink(user.userId, c.req.param('id'));
			return c.json({ success: true });
		});
}
