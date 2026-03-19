import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const userTokens = pgTable('user_tokens', {
	userId: text('user_id').primaryKey(),
	tokenBalance: integer('token_balance').default(0),
	monthlyFreeTokens: integer('monthly_free_tokens').default(1000),
	lastTokenReset: timestamp('last_token_reset', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserToken = typeof userTokens.$inferSelect;
export type NewUserToken = typeof userTokens.$inferInsert;
