/**
 * Subscriptions Schema — Plans, subscriptions, invoices
 *
 * Adapted from mana-auth: removed FK references to auth.users.
 */

import {
	pgSchema,
	pgTable,
	uuid,
	integer,
	text,
	timestamp,
	jsonb,
	index,
	pgEnum,
	boolean,
	unique,
} from 'drizzle-orm/pg-core';

export const subscriptionsSchema = pgSchema('subscriptions');

// ─── Enums ──────────────────────────────────────────────────

export const subscriptionStatusEnum = pgEnum('subscription_status', [
	'active',
	'canceled',
	'past_due',
	'unpaid',
	'trialing',
	'incomplete',
	'incomplete_expired',
	'paused',
]);

export const billingIntervalEnum = pgEnum('billing_interval', ['month', 'year']);

// ─── Tables ─────────────────────────────────────────────────

/** Subscription plans */
export const plans = subscriptionsSchema.table('plans', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull().unique(),
	description: text('description'),
	monthlyCredits: integer('monthly_credits').default(0).notNull(),
	priceMonthlyEuroCents: integer('price_monthly_euro_cents').default(0).notNull(),
	priceYearlyEuroCents: integer('price_yearly_euro_cents').default(0).notNull(),
	stripePriceIdMonthly: text('stripe_price_id_monthly'),
	stripePriceIdYearly: text('stripe_price_id_yearly'),
	stripeProductId: text('stripe_product_id'),
	features: jsonb('features').default([]).notNull(),
	maxTeamMembers: integer('max_team_members'),
	maxOrganizations: integer('max_organizations'),
	isDefault: boolean('is_default').default(false).notNull(),
	isEnterprise: boolean('is_enterprise').default(false).notNull(),
	active: boolean('active').default(true).notNull(),
	sortOrder: integer('sort_order').default(0).notNull(),
	metadata: jsonb('metadata'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** User subscriptions */
export const subscriptions = subscriptionsSchema.table(
	'subscriptions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		planId: uuid('plan_id')
			.references(() => plans.id)
			.notNull(),
		stripeSubscriptionId: text('stripe_subscription_id').unique(),
		stripeCustomerId: text('stripe_customer_id'),
		stripePriceId: text('stripe_price_id'),
		status: subscriptionStatusEnum('status').default('active').notNull(),
		billingInterval: billingIntervalEnum('billing_interval').default('month').notNull(),
		currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
		currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
		cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
		canceledAt: timestamp('canceled_at', { withTimezone: true }),
		endedAt: timestamp('ended_at', { withTimezone: true }),
		trialStart: timestamp('trial_start', { withTimezone: true }),
		trialEnd: timestamp('trial_end', { withTimezone: true }),
		metadata: jsonb('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
		stripeSubIdIdx: index('subscriptions_stripe_sub_id_idx').on(table.stripeSubscriptionId),
		statusIdx: index('subscriptions_status_idx').on(table.status),
	})
);

/** Invoices */
export const invoices = subscriptionsSchema.table(
	'invoices',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
		stripeInvoiceId: text('stripe_invoice_id').unique(),
		stripeCustomerId: text('stripe_customer_id'),
		number: text('number'),
		status: text('status'),
		amountDueEuroCents: integer('amount_due_euro_cents').default(0).notNull(),
		amountPaidEuroCents: integer('amount_paid_euro_cents').default(0).notNull(),
		currency: text('currency').default('eur').notNull(),
		hostedInvoiceUrl: text('hosted_invoice_url'),
		invoicePdfUrl: text('invoice_pdf_url'),
		periodStart: timestamp('period_start', { withTimezone: true }),
		periodEnd: timestamp('period_end', { withTimezone: true }),
		dueDate: timestamp('due_date', { withTimezone: true }),
		paidAt: timestamp('paid_at', { withTimezone: true }),
		metadata: jsonb('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('invoices_user_id_idx').on(table.userId),
		stripeInvoiceIdIdx: index('invoices_stripe_invoice_id_idx').on(table.stripeInvoiceId),
		statusIdx: index('invoices_status_idx').on(table.status),
	})
);

/** Stripe customer mapping (shared with mana-credits, may need dedup) */
export const stripeCustomers = subscriptionsSchema.table('stripe_customers', {
	userId: text('user_id').primaryKey(),
	stripeCustomerId: text('stripe_customer_id').unique().notNull(),
	email: text('email'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Type Exports ───────────────────────────────────────────

export type Plan = typeof plans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
