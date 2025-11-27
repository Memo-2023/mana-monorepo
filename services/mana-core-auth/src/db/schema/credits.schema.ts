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
import { users } from './auth.schema';

export const creditsSchema = pgSchema('credits');

// Transaction types enum
export const transactionTypeEnum = pgEnum('transaction_type', [
	'purchase',
	'usage',
	'refund',
	'bonus',
	'expiry',
	'adjustment',
]);

// Transaction status enum
export const transactionStatusEnum = pgEnum('transaction_status', [
	'pending',
	'completed',
	'failed',
	'cancelled',
]);

// Credit balances (one per user)
export const balances = creditsSchema.table('balances', {
	userId: uuid('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	balance: integer('balance').default(0).notNull(),
	freeCreditsRemaining: integer('free_credits_remaining').default(150).notNull(),
	dailyFreeCredits: integer('daily_free_credits').default(5).notNull(),
	lastDailyResetAt: timestamp('last_daily_reset_at', { withTimezone: true }).defaultNow(),
	totalEarned: integer('total_earned').default(0).notNull(),
	totalSpent: integer('total_spent').default(0).notNull(),
	version: integer('version').default(0).notNull(), // For optimistic locking
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Transaction ledger
export const transactions = creditsSchema.table(
	'transactions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		type: transactionTypeEnum('type').notNull(),
		status: transactionStatusEnum('status').default('pending').notNull(),
		amount: integer('amount').notNull(),
		balanceBefore: integer('balance_before').notNull(),
		balanceAfter: integer('balance_after').notNull(),
		appId: text('app_id').notNull(), // 'memoro', 'chat', 'picture', etc.
		description: text('description').notNull(),
		metadata: jsonb('metadata'), // Additional context
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

// Credit packages (pricing tiers)
export const packages = creditsSchema.table('packages', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	description: text('description'),
	credits: integer('credits').notNull(), // Number of credits
	priceEuroCents: integer('price_euro_cents').notNull(), // Price in euro cents
	stripePriceId: text('stripe_price_id').unique(),
	active: boolean('active').default(true).notNull(),
	sortOrder: integer('sort_order').default(0).notNull(),
	metadata: jsonb('metadata'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Purchase history
export const purchases = creditsSchema.table(
	'purchases',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
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

// Usage tracking (for analytics)
export const usageStats = creditsSchema.table(
	'usage_stats',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
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
