import {
	Injectable,
	Logger,
	NotFoundException,
	BadRequestException,
	Inject,
	forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, desc } from 'drizzle-orm';
import Stripe from 'stripe';
import { getDb } from '../db/connection';
import { plans, subscriptions, invoices, users, stripeCustomers } from '../db/schema';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class SubscriptionsService {
	private readonly logger = new Logger(SubscriptionsService.name);
	private stripe: Stripe | null = null;

	constructor(
		private configService: ConfigService,
		@Inject(forwardRef(() => StripeService))
		private stripeService: StripeService
	) {
		const secretKey = this.configService.get<string>('stripe.secretKey');
		if (secretKey) {
			this.stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
		}
	}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	// ============================================================================
	// PLANS
	// ============================================================================

	/**
	 * Get all active plans
	 */
	async getPlans() {
		const db = this.getDb();
		return db.select().from(plans).where(eq(plans.active, true)).orderBy(plans.sortOrder);
	}

	/**
	 * Get a specific plan by ID
	 */
	async getPlan(planId: string) {
		const db = this.getDb();
		const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
		if (!plan) {
			throw new NotFoundException('Plan not found');
		}
		return plan;
	}

	// ============================================================================
	// SUBSCRIPTIONS
	// ============================================================================

	/**
	 * Get user's current subscription
	 */
	async getCurrentSubscription(userId: string) {
		const db = this.getDb();

		const [subscription] = await db
			.select({
				subscription: subscriptions,
				plan: plans,
			})
			.from(subscriptions)
			.innerJoin(plans, eq(subscriptions.planId, plans.id))
			.where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
			.limit(1);

		if (!subscription) {
			// Return default free plan info
			const [freePlan] = await db.select().from(plans).where(eq(plans.isDefault, true)).limit(1);

			return {
				plan: freePlan || null,
				subscription: null,
				isFreePlan: true,
			};
		}

		return {
			plan: subscription.plan,
			subscription: subscription.subscription,
			isFreePlan: false,
		};
	}

	/**
	 * Create a Stripe Checkout Session for subscription
	 */
	async createCheckoutSession(
		userId: string,
		planId: string,
		billingInterval: 'month' | 'year' = 'month',
		successUrl: string,
		cancelUrl: string
	) {
		if (!this.stripe) {
			throw new BadRequestException('Stripe is not configured');
		}

		const db = this.getDb();

		// Get plan
		const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
		if (!plan) {
			throw new NotFoundException('Plan not found');
		}

		// Get Stripe price ID
		const stripePriceId =
			billingInterval === 'year' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

		if (!stripePriceId) {
			throw new BadRequestException(`No Stripe price configured for ${billingInterval} billing`);
		}

		// Get user
		const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
		if (!user) {
			throw new NotFoundException('User not found');
		}

		// Get or create Stripe customer
		const stripeCustomerId = await this.stripeService.getOrCreateCustomer(userId, user.email);

		// Create checkout session
		const session = await this.stripe.checkout.sessions.create({
			customer: stripeCustomerId,
			mode: 'subscription',
			payment_method_types: ['card'],
			line_items: [
				{
					price: stripePriceId,
					quantity: 1,
				},
			],
			success_url: successUrl,
			cancel_url: cancelUrl,
			metadata: {
				userId,
				planId,
				billingInterval,
			},
			subscription_data: {
				metadata: {
					userId,
					planId,
				},
			},
		});

		this.logger.log('Checkout session created', {
			sessionId: session.id,
			userId,
			planId,
		});

		return {
			sessionId: session.id,
			url: session.url,
		};
	}

	/**
	 * Create a Stripe Customer Portal session for self-service billing
	 */
	async createPortalSession(userId: string, returnUrl: string) {
		if (!this.stripe) {
			throw new BadRequestException('Stripe is not configured');
		}

		const db = this.getDb();

		// Get Stripe customer ID
		const [customer] = await db
			.select()
			.from(stripeCustomers)
			.where(eq(stripeCustomers.userId, userId))
			.limit(1);

		if (!customer) {
			throw new BadRequestException('No billing account found. Please subscribe to a plan first.');
		}

		const session = await this.stripe.billingPortal.sessions.create({
			customer: customer.stripeCustomerId,
			return_url: returnUrl,
		});

		this.logger.log('Portal session created', { userId });

		return {
			url: session.url,
		};
	}

	/**
	 * Cancel subscription (at period end)
	 */
	async cancelSubscription(userId: string) {
		if (!this.stripe) {
			throw new BadRequestException('Stripe is not configured');
		}

		const db = this.getDb();

		const [subscription] = await db
			.select()
			.from(subscriptions)
			.where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
			.limit(1);

		if (!subscription || !subscription.stripeSubscriptionId) {
			throw new NotFoundException('No active subscription found');
		}

		// Cancel at period end (user keeps access until end of billing period)
		await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
			cancel_at_period_end: true,
		});

		// Update local record
		await db
			.update(subscriptions)
			.set({
				cancelAtPeriodEnd: true,
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.id, subscription.id));

		this.logger.log('Subscription scheduled for cancellation', {
			userId,
			subscriptionId: subscription.id,
		});

		return { success: true, cancelAtPeriodEnd: true };
	}

	/**
	 * Reactivate a canceled subscription (if still within billing period)
	 */
	async reactivateSubscription(userId: string) {
		if (!this.stripe) {
			throw new BadRequestException('Stripe is not configured');
		}

		const db = this.getDb();

		const [subscription] = await db
			.select()
			.from(subscriptions)
			.where(and(eq(subscriptions.userId, userId), eq(subscriptions.cancelAtPeriodEnd, true)))
			.limit(1);

		if (!subscription || !subscription.stripeSubscriptionId) {
			throw new NotFoundException('No canceled subscription found');
		}

		// Remove cancellation
		await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
			cancel_at_period_end: false,
		});

		await db
			.update(subscriptions)
			.set({
				cancelAtPeriodEnd: false,
				canceledAt: null,
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.id, subscription.id));

		this.logger.log('Subscription reactivated', { userId });

		return { success: true };
	}

	// ============================================================================
	// INVOICES
	// ============================================================================

	/**
	 * Get user's invoices
	 */
	async getInvoices(userId: string, limit = 20) {
		const db = this.getDb();

		return db
			.select()
			.from(invoices)
			.where(eq(invoices.userId, userId))
			.orderBy(desc(invoices.createdAt))
			.limit(limit);
	}

	// ============================================================================
	// WEBHOOK HANDLERS
	// ============================================================================

	/**
	 * Handle Stripe subscription created/updated
	 */
	async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
		const db = this.getDb();
		const userId = stripeSubscription.metadata?.userId;

		if (!userId) {
			this.logger.warn('Subscription webhook missing userId in metadata', {
				subscriptionId: stripeSubscription.id,
			});
			return;
		}

		const planId = stripeSubscription.metadata?.planId;

		// Check if subscription exists
		const [existing] = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id))
			.limit(1);

		const subscriptionData = {
			userId,
			planId: planId || existing?.planId,
			stripeSubscriptionId: stripeSubscription.id,
			stripeCustomerId: stripeSubscription.customer as string,
			stripePriceId: stripeSubscription.items.data[0]?.price.id,
			status: stripeSubscription.status as any,
			billingInterval: stripeSubscription.items.data[0]?.price.recurring?.interval as any,
			currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
			currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
			cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
			canceledAt: stripeSubscription.canceled_at
				? new Date(stripeSubscription.canceled_at * 1000)
				: null,
			endedAt: stripeSubscription.ended_at ? new Date(stripeSubscription.ended_at * 1000) : null,
			trialStart: stripeSubscription.trial_start
				? new Date(stripeSubscription.trial_start * 1000)
				: null,
			trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
			updatedAt: new Date(),
		};

		if (existing) {
			await db.update(subscriptions).set(subscriptionData).where(eq(subscriptions.id, existing.id));

			this.logger.log('Subscription updated', {
				subscriptionId: existing.id,
				status: stripeSubscription.status,
			});
		} else {
			const [created] = await db
				.insert(subscriptions)
				.values(subscriptionData as any)
				.returning();

			this.logger.log('Subscription created', {
				subscriptionId: created.id,
				userId,
			});
		}
	}

	/**
	 * Handle Stripe invoice events
	 */
	async handleInvoiceUpdated(stripeInvoice: Stripe.Invoice) {
		const db = this.getDb();

		// Get user from customer
		const [customer] = await db
			.select()
			.from(stripeCustomers)
			.where(eq(stripeCustomers.stripeCustomerId, stripeInvoice.customer as string))
			.limit(1);

		if (!customer) {
			this.logger.warn('Invoice webhook: customer not found', {
				stripeCustomerId: stripeInvoice.customer,
			});
			return;
		}

		// Get subscription if exists
		let subscriptionId: string | null = null;
		if (stripeInvoice.subscription) {
			const [sub] = await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.stripeSubscriptionId, stripeInvoice.subscription as string))
				.limit(1);
			subscriptionId = sub?.id || null;
		}

		const invoiceData = {
			userId: customer.userId,
			subscriptionId,
			stripeInvoiceId: stripeInvoice.id,
			stripeCustomerId: stripeInvoice.customer as string,
			number: stripeInvoice.number,
			status: stripeInvoice.status || 'unknown',
			amountDueEuroCents: stripeInvoice.amount_due,
			amountPaidEuroCents: stripeInvoice.amount_paid,
			currency: stripeInvoice.currency,
			hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
			invoicePdfUrl: stripeInvoice.invoice_pdf,
			periodStart: stripeInvoice.period_start ? new Date(stripeInvoice.period_start * 1000) : null,
			periodEnd: stripeInvoice.period_end ? new Date(stripeInvoice.period_end * 1000) : null,
			dueDate: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : null,
			paidAt:
				stripeInvoice.status === 'paid' && stripeInvoice.status_transitions?.paid_at
					? new Date(stripeInvoice.status_transitions.paid_at * 1000)
					: null,
		};

		// Upsert invoice
		const [existing] = await db
			.select()
			.from(invoices)
			.where(eq(invoices.stripeInvoiceId, stripeInvoice.id))
			.limit(1);

		if (existing) {
			await db.update(invoices).set(invoiceData).where(eq(invoices.id, existing.id));
		} else {
			await db.insert(invoices).values(invoiceData as any);
		}

		this.logger.log('Invoice synced', {
			invoiceId: stripeInvoice.id,
			status: stripeInvoice.status,
		});
	}
}
