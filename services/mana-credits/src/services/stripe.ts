/**
 * Stripe Service — Payment integration
 *
 * Handles customer management, payment intents, checkout sessions,
 * and webhook signature verification.
 */

import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { stripeCustomers } from '../db/schema/credits';
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
		if (!this.stripe) throw new Error('Stripe not configured (missing STRIPE_SECRET_KEY)');
		return this.stripe;
	}

	async getOrCreateCustomer(userId: string, email: string): Promise<string> {
		// Check existing mapping
		const [existing] = await this.db
			.select()
			.from(stripeCustomers)
			.where(eq(stripeCustomers.userId, userId))
			.limit(1);

		if (existing) return existing.stripeCustomerId;

		// Create new Stripe customer
		const customer = await this.getStripe().customers.create({
			email,
			metadata: { userId },
		});

		await this.db.insert(stripeCustomers).values({
			userId,
			stripeCustomerId: customer.id,
			email,
		});

		return customer.id;
	}

	async createPaymentIntent(
		customerId: string,
		amountCents: number,
		metadata: Record<string, string>
	) {
		return this.getStripe().paymentIntents.create({
			amount: amountCents,
			currency: 'eur',
			customer: customerId,
			payment_method_types: ['card', 'sepa_debit'],
			metadata,
		});
	}

	async createCheckoutSession(params: {
		customerId: string;
		priceId: string;
		quantity: number;
		successUrl: string;
		cancelUrl: string;
		metadata: Record<string, string>;
	}) {
		return this.getStripe().checkout.sessions.create({
			customer: params.customerId,
			mode: 'payment',
			line_items: [{ price: params.priceId, quantity: params.quantity }],
			success_url: params.successUrl,
			cancel_url: params.cancelUrl,
			metadata: params.metadata,
			expires_after: 86400, // 24 hours
		});
	}

	verifyWebhookSignature(body: string | Buffer, signature: string, secret: string): Stripe.Event {
		return this.getStripe().webhooks.constructEvent(body, signature, secret);
	}
}
