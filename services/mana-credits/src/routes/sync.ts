/**
 * Sync billing routes — user-facing endpoints (JWT auth)
 */

import { Hono } from 'hono';
import type { SyncBillingService } from '../services/sync-billing';
import type { AuthUser } from '../middleware/jwt-auth';
import { activateSyncSchema, changeSyncIntervalSchema } from '../lib/validation';

export function createSyncRoutes(syncBillingService: SyncBillingService) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.get('/status', async (c) => {
			const user = c.get('user');
			const status = await syncBillingService.getSyncStatus(user.userId);
			return c.json(status);
		})
		.post('/activate', async (c) => {
			const user = c.get('user');
			const body = activateSyncSchema.parse(await c.req.json());
			const result = await syncBillingService.activateSync(user.userId, body.interval);
			return c.json(result);
		})
		.post('/deactivate', async (c) => {
			const user = c.get('user');
			const result = await syncBillingService.deactivateSync(user.userId);
			return c.json(result);
		})
		.post('/change-interval', async (c) => {
			const user = c.get('user');
			const body = changeSyncIntervalSchema.parse(await c.req.json());
			const result = await syncBillingService.changeBillingInterval(user.userId, body.interval);
			return c.json(result);
		});
}
