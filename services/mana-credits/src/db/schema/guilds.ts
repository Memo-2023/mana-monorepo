/**
 * Guild Pool Schema — Shared Mana pools for organizations
 *
 * Adapted from mana-core-auth: removed FK references to auth.users and organizations.
 * Organization/user IDs remain as text columns without FK constraints.
 */

import { uuid, integer, text, timestamp, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { creditsSchema } from './credits';

/** Guild Mana pool (one per organization) */
export const guildPools = creditsSchema.table('guild_pools', {
	organizationId: text('organization_id').primaryKey(),
	balance: integer('balance').default(0).notNull(),
	totalFunded: integer('total_funded').default(0).notNull(),
	totalSpent: integer('total_spent').default(0).notNull(),
	version: integer('version').default(0).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Optional per-member spending limits */
export const guildSpendingLimits = creditsSchema.table(
	'guild_spending_limits',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		organizationId: text('organization_id').notNull(),
		userId: text('user_id').notNull(),
		dailyLimit: integer('daily_limit'),
		monthlyLimit: integer('monthly_limit'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		orgUserUnique: unique('guild_spending_limits_org_user_unique').on(
			table.organizationId,
			table.userId
		),
		organizationIdIdx: index('guild_spending_limits_org_id_idx').on(table.organizationId),
		userIdIdx: index('guild_spending_limits_user_id_idx').on(table.userId),
	})
);

/** Immutable transaction ledger for guild pool */
export const guildTransactions = creditsSchema.table(
	'guild_transactions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		organizationId: text('organization_id').notNull(),
		userId: text('user_id').notNull(),
		type: text('type').notNull(), // 'funding', 'usage', 'refund'
		amount: integer('amount').notNull(),
		balanceBefore: integer('balance_before').notNull(),
		balanceAfter: integer('balance_after').notNull(),
		appId: text('app_id'),
		description: text('description').notNull(),
		metadata: jsonb('metadata'),
		idempotencyKey: text('idempotency_key').unique(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		completedAt: timestamp('completed_at', { withTimezone: true }),
	},
	(table) => ({
		organizationIdIdx: index('guild_transactions_org_id_idx').on(table.organizationId),
		userIdIdx: index('guild_transactions_user_id_idx').on(table.userId),
		createdAtIdx: index('guild_transactions_created_at_idx').on(table.createdAt),
		idempotencyKeyIdx: index('guild_transactions_idempotency_key_idx').on(table.idempotencyKey),
		orgUserCreatedIdx: index('guild_transactions_org_user_created_idx').on(
			table.organizationId,
			table.userId,
			table.createdAt
		),
	})
);

// ─── Type Exports ───────────────────────────────────────────

export type GuildPool = typeof guildPools.$inferSelect;
export type GuildTransaction = typeof guildTransactions.$inferSelect;
export type GuildSpendingLimit = typeof guildSpendingLimits.$inferSelect;
