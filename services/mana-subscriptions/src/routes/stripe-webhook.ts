import { Hono } from 'hono';
import type { StripeService } from '../services/stripe';
import type { SubscriptionsService } from '../services/subscriptions';

export function createWebhookRoutes(
	stripeService: StripeService,
	subscriptionsService: SubscriptionsService,
	webhookSecret: string
) {
	return new Hono().post('/stripe', async (c) => {
		const signature = c.req.header('stripe-signature');
		if (!signature) return c.json({ error: 'Missing signature' }, 400);

		const rawBody = await c.req.text();

		let event;
		try {
			event = stripeService.verifyWebhookSignature(rawBody, signature, webhookSecret);
		} catch {
			return c.json({ error: 'Invalid signature' }, 400);
		}

		switch (event.type) {
			case 'customer.subscription.created':
			case 'customer.subscription.updated':
			case 'customer.subscription.deleted':
				await subscriptionsService.handleSubscriptionUpdated(event.data.object as any);
				break;

			case 'invoice.created':
			case 'invoice.updated':
			case 'invoice.paid':
			case 'invoice.payment_failed':
				await subscriptionsService.handleInvoiceUpdated(event.data.object as any);
				break;

			default:
				console.log('Unhandled webhook event:', event.type);
		}

		return c.json({ received: true });
	});
}
