import { Hono } from 'hono';
import type { TagsService } from '../services/tags';
import type { AuthUser } from '../middleware/jwt-auth';

export function createTagRoutes(tagsService: TagsService) {
	return (
		new Hono<{ Variables: { user: AuthUser } }>()
			.get('/', async (c) => {
				const user = c.get('user');
				const allTags = await tagsService.getUserTags(user.userId);
				return c.json(allTags);
			})
			.post('/', async (c) => {
				const user = c.get('user');
				const body = await c.req.json();
				const tag = await tagsService.createTag(user.userId, body);
				return c.json(tag, 201);
			})
			.put('/:id', async (c) => {
				const user = c.get('user');
				const body = await c.req.json();
				const tag = await tagsService.updateTag(user.userId, c.req.param('id'), body);
				return c.json(tag);
			})
			.delete('/:id', async (c) => {
				const user = c.get('user');
				await tagsService.deleteTag(user.userId, c.req.param('id'));
				return c.json({ success: true });
			})
			.post('/defaults', async (c) => {
				const user = c.get('user');
				const defaultTags = await tagsService.createDefaultTags(user.userId);
				return c.json(defaultTags);
			})
			// Batch resolve
			.post('/resolve', async (c) => {
				const { ids } = await c.req.json();
				const resolved = await tagsService.getTagsByIds(ids || []);
				return c.json(resolved);
			})
	);
}
