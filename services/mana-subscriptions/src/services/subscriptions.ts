/**
 * Subscriptions Service — Plans, billing, invoices
 */

import { eq, and, desc } from 'drizzle-orm';
import { plans, subscriptions, invoices, stripeCustomers } from '../db/schema/subscriptions';
import type { Database } from '../db/connection';
import type { StripeService } from './stripe';
import { NotFoundError, BadRequestError } from '../lib/errors';
import type Stripe from 'stripe';

const DEFAULT_FREE_PLAN = {
	id: 'free',
	name: 'Free',
	monthlyCredits: 0,
	priceMonthlyEuroCents: 0,
	priceYearlyEuroCents: 0,
	features: [],
	maxTeamMembers: 1,
	maxOrganizations: 1,
	isDefault: true,
	active: true,
};

export class SubscriptionsService {
	constructor(
		private db: Database,
		private stripeService: StripeService
	) {}

	async getPlans() {
		return this.db.select().from(plans).where(eq(plans.active, true)).orderBy(plans.sortOrder);
	}

	async getPlan(planId: string) {
		const [plan] = await this.db.select().from(plans).where(eq(plans.id, planId)).limit(1);
		if (!plan) throw new NotFoundError('Plan not found');
		return plan;
	}

	async getCurrentSubscription(userId: string) {
		const [sub] = await this.db
			.select()
			.from(subscriptions)
			.where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
			.limit(1);

		if (!sub) {
			// Return default free plan
			const [defaultPlan] = await this.db
				.select()
				.from(plans)
				.where(eq(plans.isDefault, true))
				.limit(1);
			return { subscription: null, plan: defaultPlan || DEFAULT_FREE_PLAN };
		}

		const [plan] = await this.db.select().from(plans).where(eq(plans.id, sub.planId)).limit(1);
		return { subscription: sub, plan: plan || DEFAULT_FREE_PLAN };
	}

	/** Get plan limits for a user (used by guilds service) */
	async getUserPlanLimits(userId: string) {
		const { plan } = await this.getCurrentSubscription(userId);
		return {
			maxTeamMembers: plan.maxTeamMembers ?? 1,
			maxOrganizations: plan.maxOrganizations ?? 1,
		};
	}

	async createCheckoutSession(
		userId: string,
		userEmail: string,
		planId: string,
		billingInterval: 'month' | 'year',
		successUrl: string,
		cancelUrl: string
	) {
		const [plan] = await this.db
			.select()
			.from(plans)
			.where(and(eq(plans.id, planId), eq(plans.active, true)))
			.limit(1);
		if (!plan) throw new NotFoundError('Plan not found');

		const priceId =
			billingInterval === 'year' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
		if (!priceId) throw new BadRequestError('Stripe price not configured for this plan');

		const customerId = await this.stripeService.getOrCreateCustomer(userId, userEmail);

		const session = await this.stripeService.createCheckoutSession({
			customerId,
			priceId,
			successUrl,
			cancelUrl,
			metadata: { userId, planId, billingInterval },
		});

		return { sessionId: session.id, url: session.url };
	}

	async createPortalSession(userId: string, userEmail: string, returnUrl: string) {
		const customerId = await this.stripeService.getOrCreateCustomer(userId, userEmail);
		const session = await this.stripeService.createPortalSession(customerId, returnUrl);
		return { url: session.url };
	}

	async cancelSubscription(userId: string) {
		const [sub] = await this.db
			.select()
			.from(subscriptions)
			.where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
			.limit(1);
		if (!sub?.stripeSubscriptionId) throw new NotFoundError('No active subscription');

		await this.stripeService.cancelSubscription(sub.stripeSubscriptionId);
		await this.db
			.update(subscriptions)
			.set({ cancelAtPeriodEnd: true, canceledAt: new Date(), updatedAt: new Date() })
			.where(eq(subscriptions.id, sub.id));

		return { success: true };
	}

	async reactivateSubscription(userId: string) {
		const [sub] = await this.db
			.select()
			.from(subscriptions)
			.where(and(eq(subscriptions.userId, userId), eq(subscriptions.cancelAtPeriodEnd, true)))
			.limit(1);
		if (!sub?.stripeSubscriptionId)
			throw new NotFoundError('No canceled subscription to reactivate');

		await this.stripeService.reactivateSubscription(sub.stripeSubscriptionId);
		await this.db
			.update(subscriptions)
			.set({ cancelAtPeriodEnd: false, canceledAt: null, updatedAt: new Date() })
			.where(eq(subscriptions.id, sub.id));

		return { success: true };
	}

	async getInvoices(userId: string, limit = 20) {
		return this.db
			.select()
			.from(invoices)
			.where(eq(invoices.userId, userId))
			.orderBy(desc(invoices.createdAt))
			.limit(limit);
	}

	// ─── Webhook Handlers ─────────────────────────────────────

	async handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
		const userId = stripeSub.metadata?.userId;
		if (!userId) return;

		const planId = stripeSub.metadata?.planId;
		const priceId = stripeSub.items.data[0]?.price?.id;

		const [existing] = await this.db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.stripeSubscriptionId, stripeSub.id))
			.limit(1);

		const data = {
			userId,
			planId: planId || existing?.planId || '',
			stripeSubscriptionId: stripeSub.id,
			stripeCustomerId: stripeSub.customer as string,
			stripePriceId: priceId,
			status: stripeSub.status as any,
			currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
			currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
			cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
			canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
			endedAt: stripeSub.ended_at ? new Date(stripeSub.ended_at * 1000) : null,
			updatedAt: new Date(),
		};

		if (existing) {
			await this.db.update(subscriptions).set(data).where(eq(subscriptions.id, existing.id));
		} else {
			await this.db.insert(subscriptions).values(data);
		}
	}

	async handleInvoiceUpdated(stripeInvoice: Stripe.Invoice) {
		const userId =
			stripeInvoice.metadata?.userId || stripeInvoice.subscription_details?.metadata?.userId;
		if (!userId) return;

		const data = {
			userId,
			stripeInvoiceId: stripeInvoice.id,
			stripeCustomerId: stripeInvoice.customer as string,
			number: stripeInvoice.number,
			status: stripeInvoice.status,
			amountDueEuroCents: stripeInvoice.amount_due,
			amountPaidEuroCents: stripeInvoice.amount_paid,
			currency: stripeInvoice.currency,
			hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
			invoicePdfUrl: stripeInvoice.invoice_pdf,
			periodStart: stripeInvoice.period_start ? new Date(stripeInvoice.period_start * 1000) : null,
			periodEnd: stripeInvoice.period_end ? new Date(stripeInvoice.period_end * 1000) : null,
		};

		const [existing] = await this.db
			.select()
			.from(invoices)
			.where(eq(invoices.stripeInvoiceId, stripeInvoice.id))
			.limit(1);

		if (existing) {
			await this.db.update(invoices).set(data).where(eq(invoices.id, existing.id));
		} else {
			await this.db.insert(invoices).values(data);
		}
	}
}
