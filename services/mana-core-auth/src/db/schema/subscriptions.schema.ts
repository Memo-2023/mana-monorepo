import {
	pgSchema,
	uuid,
	text,
	timestamp,
	integer,
	boolean,
	jsonb,
	index,
	pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema';

export const subscriptionsSchema = pgSchema('subscriptions');

// Subscription status enum
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

// Billing interval enum
export const billingIntervalEnum = pgEnum('billing_interval', ['month', 'year']);

// Subscription plans (Free, Pro, Enterprise etc.)
export const plans = subscriptionsSchema.table('plans', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(), // Free, Pro, Enterprise
	description: text('description'),
	// Monthly credits included
	monthlyCredits: integer('monthly_credits').notNull().default(0),
	// Pricing
	priceMonthlyEuroCents: integer('price_monthly_euro_cents').notNull().default(0),
	priceYearlyEuroCents: integer('price_yearly_euro_cents').notNull().default(0),
	// Stripe Price IDs
	stripePriceIdMonthly: text('stripe_price_id_monthly'),
	stripePriceIdYearly: text('stripe_price_id_yearly'),
	stripeProductId: text('stripe_product_id'),
	// Features (JSON array of feature strings)
	features: jsonb('features').$type<string[]>().default([]),
	// Limits
	maxTeamMembers: integer('max_team_members'),
	maxOrganizations: integer('max_organizations'),
	// Meta
	isDefault: boolean('is_default').default(false).notNull(),
	isEnterprise: boolean('is_enterprise').default(false).notNull(),
	active: boolean('active').default(true).notNull(),
	sortOrder: integer('sort_order').default(0).notNull(),
	metadata: jsonb('metadata'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// User subscriptions
export const subscriptions = subscriptionsSchema.table(
	'subscriptions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		planId: uuid('plan_id')
			.references(() => plans.id)
			.notNull(),
		// Stripe references
		stripeSubscriptionId: text('stripe_subscription_id').unique(),
		stripeCustomerId: text('stripe_customer_id'),
		stripePriceId: text('stripe_price_id'),
		// Status
		status: subscriptionStatusEnum('status').default('active').notNull(),
		billingInterval: billingIntervalEnum('billing_interval').default('month').notNull(),
		// Dates
		currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
		currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
		cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
		canceledAt: timestamp('canceled_at', { withTimezone: true }),
		endedAt: timestamp('ended_at', { withTimezone: true }),
		trialStart: timestamp('trial_start', { withTimezone: true }),
		trialEnd: timestamp('trial_end', { withTimezone: true }),
		// Meta
		metadata: jsonb('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
		stripeSubscriptionIdIdx: index('subscriptions_stripe_subscription_id_idx').on(
			table.stripeSubscriptionId
		),
		statusIdx: index('subscriptions_status_idx').on(table.status),
	})
);

// Invoices (synced from Stripe)
export const invoices = subscriptionsSchema.table(
	'invoices',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
		// Stripe references
		stripeInvoiceId: text('stripe_invoice_id').unique().notNull(),
		stripeCustomerId: text('stripe_customer_id'),
		// Invoice details
		number: text('number'),
		status: text('status').notNull(), // draft, open, paid, void, uncollectible
		amountDueEuroCents: integer('amount_due_euro_cents').notNull(),
		amountPaidEuroCents: integer('amount_paid_euro_cents').notNull().default(0),
		currency: text('currency').default('eur').notNull(),
		// URLs
		hostedInvoiceUrl: text('hosted_invoice_url'),
		invoicePdfUrl: text('invoice_pdf_url'),
		// Dates
		periodStart: timestamp('period_start', { withTimezone: true }),
		periodEnd: timestamp('period_end', { withTimezone: true }),
		dueDate: timestamp('due_date', { withTimezone: true }),
		paidAt: timestamp('paid_at', { withTimezone: true }),
		// Meta
		metadata: jsonb('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('invoices_user_id_idx').on(table.userId),
		stripeInvoiceIdIdx: index('invoices_stripe_invoice_id_idx').on(table.stripeInvoiceId),
		statusIdx: index('invoices_status_idx').on(table.status),
	})
);
