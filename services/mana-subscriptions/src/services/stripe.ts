/**
 * Stripe Service — Customer management, checkout, portal, webhook verification
 */

import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { stripeCustomers } from '../db/schema/subscriptions';
import type { Database } from '../db/connection';

export class StripeService {
	private stripe: Stripe | null;

	constructor(
		private db: Database,
		secretKey: string
	) {
		this.stripe = secretKey ? new Stripe(secretKey, { apiVersion: '2025-04-30.basil' }) : null;
	}

	private getStripe(): Stripe {
		if (!this.stripe) throw new Error('Stripe not configured');
		return this.stripe;
	}

	async getOrCreateCustomer(userId: string, email: string): Promise<string> {
		const [existing] = await this.db
			.select()
			.from(stripeCustomers)
			.where(eq(stripeCustomers.userId, userId))
			.limit(1);

		if (existing) return existing.stripeCustomerId;

		const customer = await this.getStripe().customers.create({ email, metadata: { userId } });

		await this.db
			.insert(stripeCustomers)
			.values({ userId, stripeCustomerId: customer.id, email })
			.onConflictDoNothing();

		return customer.id;
	}

	async createCheckoutSession(params: {
		customerId: string;
		priceId: string;
		successUrl: string;
		cancelUrl: string;
		metadata: Record<string, string>;
	}) {
		return this.getStripe().checkout.sessions.create({
			customer: params.customerId,
			mode: 'subscription',
			line_items: [{ price: params.priceId, quantity: 1 }],
			success_url: params.successUrl,
			cancel_url: params.cancelUrl,
			metadata: params.metadata,
		});
	}

	async createPortalSession(customerId: string, returnUrl: string) {
		return this.getStripe().billingPortal.sessions.create({
			customer: customerId,
			return_url: returnUrl,
		});
	}

	async cancelSubscription(subscriptionId: string) {
		return this.getStripe().subscriptions.update(subscriptionId, {
			cancel_at_period_end: true,
		});
	}

	async reactivateSubscription(subscriptionId: string) {
		return this.getStripe().subscriptions.update(subscriptionId, {
			cancel_at_period_end: false,
		});
	}

	verifyWebhookSignature(body: string | Buffer, signature: string, secret: string): Stripe.Event {
		return this.getStripe().webhooks.constructEvent(body, signature, secret);
	}
}
