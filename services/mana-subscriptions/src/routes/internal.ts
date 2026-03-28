/**
 * Internal routes — service-to-service (X-Service-Key auth)
 * Used by guilds service to check plan limits.
 */

import { Hono } from 'hono';
import type { SubscriptionsService } from '../services/subscriptions';

export function createInternalRoutes(subscriptionsService: SubscriptionsService) {
	return new Hono()
		.get('/plan-limits/:userId', async (c) => {
			const limits = await subscriptionsService.getUserPlanLimits(c.req.param('userId'));
			return c.json(limits);
		})
		.get('/subscription/:userId', async (c) => {
			const sub = await subscriptionsService.getCurrentSubscription(c.req.param('userId'));
			return c.json(sub);
		});
}
