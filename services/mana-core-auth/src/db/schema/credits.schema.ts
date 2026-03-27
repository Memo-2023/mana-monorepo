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
// Simplified: removed bonus, expiry, adjustment - kept core types
export const transactionTypeEnum = pgEnum('transaction_type', [
	'purchase',
	'usage',
	'refund',
	'gift',
	'guild_funding',
]);

// Transaction status enum
export const transactionStatusEnum = pgEnum('transaction_status', [
	'pending',
	'completed',
	'failed',
	'cancelled',
]);

// Stripe customer mapping (for reusing Stripe customers across purchases)
export const stripeCustomers = creditsSchema.table('stripe_customers', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	stripeCustomerId: text('stripe_customer_id').unique().notNull(),
	email: text('email'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Credit balances (one per user)
// Simplified: removed free credits columns (no signup bonus, no daily credits)
export const balances = creditsSchema.table('balances', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	balance: integer('balance').default(0).notNull(),
	totalEarned: integer('total_earned').default(0).notNull(),
	totalSpent: integer('total_spent').default(0).notNull(),
	version: integer('version').default(0).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Transaction ledger
export const transactions = creditsSchema.table(
	'transactions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		type: transactionTypeEnum('type').notNull(),
		status: transactionStatusEnum('status').default('pending').notNull(),
		amount: integer('amount').notNull(),
		balanceBefore: integer('balance_before').notNull(),
		balanceAfter: integer('balance_after').notNull(),
		appId: text('app_id').notNull(),
		description: text('description').notNull(),
		metadata: jsonb('metadata'),
		idempotencyKey: text('idempotency_key').unique(),
		guildId: text('guild_id'), // Set when transaction is guild-related (e.g. funding a guild pool)
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		completedAt: timestamp('completed_at', { withTimezone: true }),
	},
	(table) => ({
		userIdIdx: index('transactions_user_id_idx').on(table.userId),
		appIdIdx: index('transactions_app_id_idx').on(table.appId),
		createdAtIdx: index('transactions_created_at_idx').on(table.createdAt),
		idempotencyKeyIdx: index('transactions_idempotency_key_idx').on(table.idempotencyKey),
		guildIdIdx: index('transactions_guild_id_idx').on(table.guildId),
	})
);

// Credit packages (pricing tiers)
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

// Purchase history
export const purchases = creditsSchema.table(
	'purchases',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id')
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
		userId: text('user_id')
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

// Guild pool tables are in guilds.schema.ts
