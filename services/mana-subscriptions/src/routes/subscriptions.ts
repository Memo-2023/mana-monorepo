import { Hono } from 'hono';
import type { SubscriptionsService } from '../services/subscriptions';
import type { AuthUser } from '../middleware/jwt-auth';
import { z } from 'zod';

const checkoutSchema = z.object({
	planId: z.string().uuid(),
	billingInterval: z.enum(['month', 'year']),
	successUrl: z.string().url(),
	cancelUrl: z.string().url(),
});

const portalSchema = z.object({
	returnUrl: z.string().url(),
});

export function createSubscriptionRoutes(subscriptionsService: SubscriptionsService) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.get('/plans', async (c) => {
			return c.json(await subscriptionsService.getPlans());
		})
		.get('/plans/:planId', async (c) => {
			return c.json(await subscriptionsService.getPlan(c.req.param('planId')));
		})
		.get('/current', async (c) => {
			const user = c.get('user');
			return c.json(await subscriptionsService.getCurrentSubscription(user.userId));
		})
		.post('/checkout', async (c) => {
			const user = c.get('user');
			const body = checkoutSchema.parse(await c.req.json());
			const result = await subscriptionsService.createCheckoutSession(
				user.userId,
				user.email,
				body.planId,
				body.billingInterval,
				body.successUrl,
				body.cancelUrl
			);
			return c.json(result);
		})
		.post('/portal', async (c) => {
			const user = c.get('user');
			const body = portalSchema.parse(await c.req.json());
			const result = await subscriptionsService.createPortalSession(
				user.userId,
				user.email,
				body.returnUrl
			);
			return c.json(result);
		})
		.post('/cancel', async (c) => {
			const user = c.get('user');
			return c.json(await subscriptionsService.cancelSubscription(user.userId));
		})
		.post('/reactivate', async (c) => {
			const user = c.get('user');
			return c.json(await subscriptionsService.reactivateSubscription(user.userId));
		})
		.get('/invoices', async (c) => {
			const user = c.get('user');
			const limit = parseInt(c.req.query('limit') || '20', 10);
			return c.json(await subscriptionsService.getInvoices(user.userId, limit));
		});
}
