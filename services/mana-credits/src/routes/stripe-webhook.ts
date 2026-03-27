/**
 * Stripe webhook handler — credit-related events only
 */

import { Hono } from 'hono';
import type { StripeService } from '../services/stripe';
import type { CreditsService } from '../services/credits';

export function createWebhookRoutes(
	stripeService: StripeService,
	creditsService: CreditsService,
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
			case 'payment_intent.succeeded': {
				const pi = event.data.object;
				await creditsService.completePurchase(pi.id);
				break;
			}
			case 'payment_intent.payment_failed': {
				const pi = event.data.object;
				await creditsService.failPurchase(pi.id);
				break;
			}
			case 'checkout.session.completed': {
				// Checkout sessions create PaymentIntents which trigger payment_intent.succeeded
				// No additional action needed here unless using direct checkout mode
				break;
			}
			case 'payment_intent.processing': {
				// SEPA debit processing — no action needed, wait for success/failure
				console.log('Payment processing (SEPA):', event.data.object.id);
				break;
			}
			default:
				console.log('Unhandled webhook event:', event.type);
		}

		return c.json({ received: true });
	});
}
