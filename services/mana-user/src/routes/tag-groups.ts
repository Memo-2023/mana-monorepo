import { Hono } from 'hono';
import type { TagsService } from '../services/tags';
import type { AuthUser } from '../middleware/jwt-auth';

export function createTagGroupRoutes(tagsService: TagsService) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.get('/', async (c) => {
			const user = c.get('user');
			return c.json(await tagsService.getUserGroups(user.userId));
		})
		.post('/', async (c) => {
			const user = c.get('user');
			const body = await c.req.json();
			return c.json(await tagsService.createGroup(user.userId, body), 201);
		})
		.put('/:id', async (c) => {
			const user = c.get('user');
			const body = await c.req.json();
			return c.json(await tagsService.updateGroup(user.userId, c.req.param('id'), body));
		})
		.delete('/:id', async (c) => {
			const user = c.get('user');
			await tagsService.deleteGroup(user.userId, c.req.param('id'));
			return c.json({ success: true });
		});
}
