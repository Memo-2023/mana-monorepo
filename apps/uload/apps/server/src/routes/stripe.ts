import { Hono } from 'hono';
import type { AuthUser } from '../middleware/jwt-auth';

export function createStripeRoutes() {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.post('/checkout', async (c) => {
			// TODO: Implement Stripe checkout session creation
			return c.json({ error: 'Stripe not configured yet' }, 501);
		})
		.post('/webhook', async (c) => {
			// TODO: Implement Stripe webhook handling
			return c.json({ received: true });
		});
}
