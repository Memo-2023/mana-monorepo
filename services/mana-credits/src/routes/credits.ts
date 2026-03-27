/**
 * Credit routes — personal balance endpoints (JWT auth)
 */

import { Hono } from 'hono';
import type { CreditsService } from '../services/credits';
import type { AuthUser } from '../middleware/jwt-auth';
import { useCreditsSchema, purchaseCreditsSchema } from '../lib/validation';

export function createCreditsRoutes(creditsService: CreditsService) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.get('/balance', async (c) => {
			const user = c.get('user');
			const balance = await creditsService.getBalance(user.userId);
			return c.json(balance);
		})
		.post('/use', async (c) => {
			const user = c.get('user');
			const body = useCreditsSchema.parse(await c.req.json());
			const result = await creditsService.useCreditsWithSource(user.userId, body);
			return c.json(result);
		})
		.get('/transactions', async (c) => {
			const user = c.get('user');
			const limit = parseInt(c.req.query('limit') || '50', 10);
			const offset = parseInt(c.req.query('offset') || '0', 10);
			const txs = await creditsService.getTransactions(user.userId, limit, offset);
			return c.json(txs);
		})
		.get('/purchases', async (c) => {
			const user = c.get('user');
			const purchases = await creditsService.getPurchases(user.userId);
			return c.json(purchases);
		})
		.get('/packages', async (c) => {
			const pkgs = await creditsService.getPackages();
			return c.json(pkgs);
		})
		.post('/purchase', async (c) => {
			const user = c.get('user');
			const body = purchaseCreditsSchema.parse(await c.req.json());
			const result = await creditsService.initiatePurchase(user.userId, body.packageId, user.email);
			return c.json(result);
		})
		.get('/purchase/:purchaseId', async (c) => {
			const user = c.get('user');
			const purchase = await creditsService.getPurchaseStatus(
				user.userId,
				c.req.param('purchaseId')
			);
			return c.json(purchase);
		});
}
