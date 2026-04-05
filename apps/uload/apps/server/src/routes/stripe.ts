import { Hono } from 'hono';
import Stripe from 'stripe';
import type { AuthVariables } from '@mana/shared-hono';
import type { Config } from '../config';

const PRICES = {
	monthly: { lookup: 'uload_pro_monthly', amount: 499 },
	yearly: { lookup: 'uload_pro_yearly', amount: 3999 },
} as const;

export function createStripeRoutes(config: Config) {
	const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

	return new Hono<{ Variables: AuthVariables }>()
		.post('/checkout', async (c) => {
			if (!stripe) return c.json({ error: 'Stripe not configured' }, 501);

			const userId = c.get('userId');
			const userEmail = c.get('userEmail');
			const { priceType } = await c.req.json<{ priceType: keyof typeof PRICES }>();
			const price = PRICES[priceType];
			if (!price) return c.json({ error: 'Invalid price type' }, 400);

			const session = await stripe.checkout.sessions.create({
				mode: 'subscription',
				customer_email: userEmail,
				metadata: { userId },
				line_items: [
					{
						price_data: {
							currency: 'eur',
							unit_amount: price.amount,
							recurring: { interval: priceType === 'yearly' ? 'year' : 'month' },
							product_data: { name: `uLoad Pro (${priceType})` },
						},
						quantity: 1,
					},
				],
				success_url: `${config.baseUrl}/settings?checkout=success`,
				cancel_url: `${config.baseUrl}/pricing`,
			});

			return c.json({ url: session.url });
		})
		.post('/webhook', async (c) => {
			if (!stripe) return c.json({ error: 'Stripe not configured' }, 501);

			const body = await c.req.text();
			const sig = c.req.header('stripe-signature');
			if (!sig) return c.json({ error: 'Missing signature' }, 400);

			let event: Stripe.Event;
			try {
				event = stripe.webhooks.constructEvent(body, sig, config.stripeWebhookSecret);
			} catch {
				return c.json({ error: 'Invalid signature' }, 400);
			}

			switch (event.type) {
				case 'checkout.session.completed': {
					// TODO: Update user subscription status in mana-user or sync_changes
					// const _session = event.data.object as Stripe.Checkout.Session;
					break;
				}
				case 'customer.subscription.deleted': {
					// TODO: Reset user to free tier
					break;
				}
			}

			return c.json({ received: true });
		});
}
