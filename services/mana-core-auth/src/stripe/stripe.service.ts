import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { stripeCustomers } from '../db/schema';

export interface PaymentIntentMetadata {
	userId: string;
	packageId: string;
	purchaseId: string;
}

export interface CheckoutSessionMetadata {
	userId: string;
	packageId: string;
	purchaseId: string;
	roomId?: string;
}

export interface CheckoutSessionOptions {
	customerId: string;
	amountCents: number;
	productName: string;
	credits: number;
	metadata: CheckoutSessionMetadata;
	successUrl: string;
	cancelUrl: string;
}

@Injectable()
export class StripeService {
	private stripe: Stripe | null = null;
	private readonly logger = new Logger(StripeService.name);

	constructor(private configService: ConfigService) {
		const secretKey = this.configService.get<string>('stripe.secretKey');
		if (secretKey) {
			this.stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
			this.logger.log('Stripe client initialized');
		} else {
			this.logger.warn('Stripe secret key not configured - payment features disabled');
		}
	}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	private ensureStripeConfigured(): Stripe {
		if (!this.stripe) {
			throw new ServiceUnavailableException('Stripe is not configured');
		}
		return this.stripe;
	}

	/**
	 * Get or create a Stripe customer for a user
	 * Caches the customer ID in the stripe_customers table
	 */
	async getOrCreateCustomer(userId: string, email: string): Promise<string> {
		const stripe = this.ensureStripeConfigured();
		const db = this.getDb();

		// Check if we already have a Stripe customer for this user
		const [existing] = await db
			.select()
			.from(stripeCustomers)
			.where(eq(stripeCustomers.userId, userId))
			.limit(1);

		if (existing) {
			return existing.stripeCustomerId;
		}

		// Create a new Stripe customer
		try {
			const customer = await stripe.customers.create({
				email,
				metadata: { userId },
			});

			// Store the mapping
			await db.insert(stripeCustomers).values({
				userId,
				stripeCustomerId: customer.id,
				email,
			});

			this.logger.log('Created Stripe customer', { userId, customerId: customer.id });
			return customer.id;
		} catch (error) {
			this.logger.error('Failed to create Stripe customer', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new ServiceUnavailableException('Failed to create payment customer');
		}
	}

	/**
	 * Create a PaymentIntent for a credit package purchase
	 */
	async createPaymentIntent(
		customerId: string,
		amountCents: number,
		metadata: PaymentIntentMetadata
	): Promise<Stripe.PaymentIntent> {
		const stripe = this.ensureStripeConfigured();

		try {
			const paymentIntent = await stripe.paymentIntents.create({
				amount: amountCents,
				currency: 'eur',
				customer: customerId,
				metadata: {
					userId: metadata.userId,
					packageId: metadata.packageId,
					purchaseId: metadata.purchaseId,
				},
				automatic_payment_methods: {
					enabled: true,
				},
			});

			this.logger.log('Created PaymentIntent', {
				paymentIntentId: paymentIntent.id,
				amount: amountCents,
				customerId,
			});

			return paymentIntent;
		} catch (error) {
			this.logger.error('Failed to create PaymentIntent', {
				customerId,
				amount: amountCents,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			if (error instanceof Stripe.errors.StripeError) {
				throw new ServiceUnavailableException(`Payment service error: ${error.message}`);
			}
			throw new ServiceUnavailableException('Failed to create payment intent');
		}
	}

	/**
	 * Verify a Stripe webhook signature and parse the event
	 */
	verifyWebhookSignature(payload: Buffer, signature: string): Stripe.Event {
		const stripe = this.ensureStripeConfigured();
		const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

		if (!webhookSecret) {
			throw new ServiceUnavailableException('Stripe webhook secret not configured');
		}

		try {
			return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
		} catch (error) {
			this.logger.warn('Webhook signature verification failed', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Retrieve a PaymentIntent by ID (for verification)
	 */
	async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
		const stripe = this.ensureStripeConfigured();
		return stripe.paymentIntents.retrieve(paymentIntentId);
	}

	/**
	 * Create a Checkout Session for credit purchase
	 * Returns a URL where the user can complete payment
	 */
	async createCheckoutSession(options: CheckoutSessionOptions): Promise<Stripe.Checkout.Session> {
		const stripe = this.ensureStripeConfigured();

		try {
			const session = await stripe.checkout.sessions.create({
				customer: options.customerId,
				mode: 'payment',
				payment_method_types: ['card'],
				line_items: [
					{
						price_data: {
							currency: 'eur',
							product_data: {
								name: options.productName,
								description: `${options.credits} Credits`,
							},
							unit_amount: options.amountCents,
						},
						quantity: 1,
					},
				],
				metadata: {
					userId: options.metadata.userId,
					packageId: options.metadata.packageId,
					purchaseId: options.metadata.purchaseId,
					roomId: options.metadata.roomId || '',
				},
				success_url: options.successUrl,
				cancel_url: options.cancelUrl,
				expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
			});

			this.logger.log('Created Checkout Session', {
				sessionId: session.id,
				amount: options.amountCents,
				customerId: options.customerId,
				purchaseId: options.metadata.purchaseId,
			});

			return session;
		} catch (error) {
			this.logger.error('Failed to create Checkout Session', {
				customerId: options.customerId,
				amount: options.amountCents,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			if (error instanceof Stripe.errors.StripeError) {
				throw new ServiceUnavailableException(`Payment service error: ${error.message}`);
			}
			throw new ServiceUnavailableException('Failed to create checkout session');
		}
	}

	/**
	 * Retrieve a Checkout Session by ID
	 */
	async retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
		const stripe = this.ensureStripeConfigured();
		return stripe.checkout.sessions.retrieve(sessionId);
	}
}
