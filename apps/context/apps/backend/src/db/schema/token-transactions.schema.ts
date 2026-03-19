import {
	pgTable,
	uuid,
	text,
	timestamp,
	varchar,
	integer,
	numeric,
	index,
} from 'drizzle-orm/pg-core';

export const tokenTransactions = pgTable(
	'token_transactions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		amount: integer('amount').notNull(),
		transactionType: varchar('transaction_type', { length: 50 }).notNull(),
		modelUsed: varchar('model_used', { length: 100 }),
		promptTokens: integer('prompt_tokens'),
		completionTokens: integer('completion_tokens'),
		totalTokens: integer('total_tokens'),
		costUsd: numeric('cost_usd', { precision: 10, scale: 6 }),
		documentId: uuid('document_id'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('token_transactions_user_id_idx').on(table.userId),
		index('token_transactions_created_at_idx').on(table.createdAt),
	]
);

export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type NewTokenTransaction = typeof tokenTransactions.$inferInsert;
