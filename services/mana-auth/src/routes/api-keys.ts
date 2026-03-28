/**
 * API Key routes — Service-to-service authentication keys
 */

import { Hono } from 'hono';
import type { ApiKeysService } from '../services/api-keys';
import type { AuthUser } from '../middleware/jwt-auth';

export function createApiKeyRoutes(apiKeysService: ApiKeysService) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.get('/', async (c) => {
			const user = c.get('user');
			return c.json(await apiKeysService.listUserApiKeys(user.userId));
		})
		.post('/', async (c) => {
			const user = c.get('user');
			const body = await c.req.json();
			const result = await apiKeysService.createApiKey(user.userId, body);
			return c.json(result, 201);
		})
		.delete('/:id', async (c) => {
			const user = c.get('user');
			return c.json(await apiKeysService.revokeApiKey(user.userId, c.req.param('id')));
		});
}

/** Validation route — no JWT required, uses API key itself */
export function createApiKeyValidationRoute(apiKeysService: ApiKeysService) {
	return new Hono().post('/validate', async (c) => {
		const { apiKey, scope } = await c.req.json();
		return c.json(await apiKeysService.validateApiKey(apiKey, scope));
	});
}
