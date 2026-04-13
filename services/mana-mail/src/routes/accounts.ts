/**
 * Account routes — mail account settings (JWT auth).
 */

import { Hono } from 'hono';
import type { AccountService } from '../services/account-service';
import type { AuthUser } from '../middleware/jwt-auth';
import { updateAccountSchema } from '../lib/validation';

export function createAccountRoutes(accountService: AccountService) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.get('/accounts', async (c) => {
			const user = c.get('user');
			const accounts = await accountService.getAccounts(user.userId);
			return c.json(accounts);
		})
		.put('/accounts/:accountId', async (c) => {
			const user = c.get('user');
			const accountId = c.req.param('accountId');
			const body = updateAccountSchema.parse(await c.req.json());
			const updated = await accountService.updateAccount(user.userId, accountId, body);
			return c.json(updated);
		});
}
