/**
 * Admin routes — privileged ops (JWT auth + admin role check).
 *
 * Currently exposes sync-gift management. Extend here as more
 * admin-scoped credit operations are needed.
 */

import { Hono } from 'hono';
import type { SyncBillingService } from '../services/sync-billing';
import type { AuthUser } from '../middleware/jwt-auth';

export function createAdminRoutes(syncBillingService: SyncBillingService) {
	const app = new Hono<{ Variables: { user: AuthUser } }>();

	app.use('*', async (c, next) => {
		const user = c.get('user');
		if (user.role !== 'admin') {
			return c.json({ error: 'Forbidden', message: 'Admin access required' }, 403);
		}
		await next();
	});

	app.post('/sync/:userId/gift', async (c) => {
		const { userId } = c.req.param();
		const admin = c.get('user');
		const result = await syncBillingService.grantSyncGift(userId, admin.userId);
		return c.json(result);
	});

	app.delete('/sync/:userId/gift', async (c) => {
		const { userId } = c.req.param();
		const result = await syncBillingService.revokeSyncGift(userId);
		return c.json(result);
	});

	app.get('/sync/:userId', async (c) => {
		const { userId } = c.req.param();
		const status = await syncBillingService.getSyncStatus(userId);
		return c.json(status);
	});

	return app;
}
