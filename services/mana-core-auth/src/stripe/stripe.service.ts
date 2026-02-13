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
}
