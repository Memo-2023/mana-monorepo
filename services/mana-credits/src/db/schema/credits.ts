/**
 * Credits Schema — Personal balance, transactions, packages, purchases
 *
 * Adapted from mana-auth: removed FK references to auth.users (separate DB).
 * userId columns remain as text() without foreign key constraints.
 */

import {
	pgSchema,
	uuid,
	integer,
	text,
	timestamp,
	jsonb,
	index,
	pgEnum,
	boolean,
} from 'drizzle-orm/pg-core';

export const creditsSchema = pgSchema('credits');

// ─── Enums ──────────────────────────────────────────────────

export const transactionTypeEnum = pgEnum('transaction_type', [
	'purchase',
	'usage',
	'refund',
	'gift',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
	'pending',
	'completed',
	'failed',
	'cancelled',
]);

// ─── Tables ─────────────────────────────────────────────────

/** Stripe customer mapping (reuse customers across purchases) */
export const stripeCustomers = creditsSchema.table('stripe_customers', {
	userId: text('user_id').primaryKey(),
	stripeCustomerId: text('stripe_customer_id').unique().notNull(),
	email: text('email'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Credit balances (one per user, optimistic locking via version) */
export const balances = creditsSchema.table('balances', {
	userId: text('user_id').primaryKey(),
	balance: integer('balance').default(0).notNull(),
	totalEarned: integer('total_earned').default(0).notNull(),
	totalSpent: integer('total_spent').default(0).notNull(),
	version: integer('version').default(0).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Immutable transaction ledger */
export const transactions = creditsSchema.table(
	'transactions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		type: transactionTypeEnum('type').notNull(),
		status: transactionStatusEnum('status').default('pending').notNull(),
		amount: integer('amount').notNull(),
		balanceBefore: integer('balance_before').notNull(),
		balanceAfter: integer('balance_after').notNull(),
		appId: text('app_id').notNull(),
		description: text('description').notNull(),
		metadata: jsonb('metadata'),
		idempotencyKey: text('idempotency_key').unique(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		completedAt: timestamp('completed_at', { withTimezone: true }),
	},
	(table) => ({
		userIdIdx: index('transactions_user_id_idx').on(table.userId),
		appIdIdx: index('transactions_app_id_idx').on(table.appId),
		createdAtIdx: index('transactions_created_at_idx').on(table.createdAt),
		idempotencyKeyIdx: index('transactions_idempotency_key_idx').on(table.idempotencyKey),
	})
);

/** Credit packages (pricing tiers) */
export const packages = creditsSchema.table('packages', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	description: text('description'),
	credits: integer('credits').notNull(),
	priceEuroCents: integer('price_euro_cents').notNull(),
	stripePriceId: text('stripe_price_id').unique(),
	active: boolean('active').default(true).notNull(),
	sortOrder: integer('sort_order').default(0).notNull(),
	metadata: jsonb('metadata'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Purchase history */
export const purchases = creditsSchema.table(
	'purchases',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		packageId: uuid('package_id').references(() => packages.id),
		credits: integer('credits').notNull(),
		priceEuroCents: integer('price_euro_cents').notNull(),
		stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
		stripeCustomerId: text('stripe_customer_id'),
		status: transactionStatusEnum('status').default('pending').notNull(),
		metadata: jsonb('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		completedAt: timestamp('completed_at', { withTimezone: true }),
	},
	(table) => ({
		userIdIdx: index('purchases_user_id_idx').on(table.userId),
		stripePaymentIntentIdIdx: index('purchases_stripe_payment_intent_id_idx').on(
			table.stripePaymentIntentId
		),
	})
);

/** Usage tracking (analytics) */
export const usageStats = creditsSchema.table(
	'usage_stats',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		appId: text('app_id').notNull(),
		creditsUsed: integer('credits_used').notNull(),
		date: timestamp('date', { withTimezone: true }).notNull(),
		metadata: jsonb('metadata'),
	},
	(table) => ({
		userIdDateIdx: index('usage_stats_user_id_date_idx').on(table.userId, table.date),
		appIdDateIdx: index('usage_stats_app_id_date_idx').on(table.appId, table.date),
	})
);

// ─── Type Exports ───────────────────────────────────────────

export type Balance = typeof balances.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Package = typeof packages.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
