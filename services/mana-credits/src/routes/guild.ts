/**
 * Guild pool routes — shared credit pool endpoints (JWT auth)
 */

import { Hono } from 'hono';
import type { GuildPoolService } from '../services/guild-pool';
import type { AuthUser } from '../middleware/jwt-auth';
import { fundGuildPoolSchema, setSpendingLimitSchema } from '../lib/validation';

export function createGuildRoutes(guildPoolService: GuildPoolService) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.get('/:guildId/balance', async (c) => {
			const user = c.get('user');
			const balance = await guildPoolService.getBalance(c.req.param('guildId'), user.userId);
			return c.json(balance);
		})
		.post('/:guildId/fund', async (c) => {
			const user = c.get('user');
			const body = fundGuildPoolSchema.parse(await c.req.json());
			const result = await guildPoolService.fundPool(
				c.req.param('guildId'),
				user.userId,
				body.amount,
				body.idempotencyKey
			);
			return c.json(result);
		})
		.post('/:guildId/use', async (c) => {
			const user = c.get('user');
			const body = await c.req.json();
			const result = await guildPoolService.useGuildCredits(
				c.req.param('guildId'),
				user.userId,
				body
			);
			return c.json(result);
		})
		.get('/:guildId/transactions', async (c) => {
			const user = c.get('user');
			const limit = parseInt(c.req.query('limit') || '50', 10);
			const offset = parseInt(c.req.query('offset') || '0', 10);
			const txs = await guildPoolService.getTransactions(
				c.req.param('guildId'),
				user.userId,
				limit,
				offset
			);
			return c.json(txs);
		})
		.get('/:guildId/members/:userId/limits', async (c) => {
			const limits = await guildPoolService.getSpendingLimits(
				c.req.param('guildId'),
				c.req.param('userId')
			);
			return c.json(limits);
		})
		.put('/:guildId/members/:userId/limits', async (c) => {
			const user = c.get('user');
			const body = setSpendingLimitSchema.parse(await c.req.json());
			const result = await guildPoolService.setSpendingLimits(
				c.req.param('guildId'),
				c.req.param('userId'),
				user.userId,
				body.dailyLimit ?? null,
				body.monthlyLimit ?? null
			);
			return c.json(result);
		});
}
