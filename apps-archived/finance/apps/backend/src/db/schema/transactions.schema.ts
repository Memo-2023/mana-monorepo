import {
	pgTable,
	uuid,
	timestamp,
	varchar,
	text,
	boolean,
	decimal,
	date,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';
import { accounts } from './accounts.schema';
import { categories } from './categories.schema';

export type TransactionType = 'income' | 'expense';

export interface RecurrenceRule {
	frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
	interval: number;
	endDate?: string;
	dayOfMonth?: number;
	dayOfWeek?: number;
}

export const transactions = pgTable(
	'transactions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').notNull(),

		// Relations
		accountId: uuid('account_id')
			.references(() => accounts.id, { onDelete: 'cascade' })
			.notNull(),
		categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),

		// Transaction details
		type: varchar('type', { length: 10 }).notNull().$type<TransactionType>(),
		amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
		currency: varchar('currency', { length: 3 }).default('EUR').notNull(),

		// Date
		date: date('date').notNull(),

		// Description
		description: text('description'),
		notes: text('notes'),

		// Payee/Payer
		payee: varchar('payee', { length: 200 }),

		// Recurrence
		isRecurring: boolean('is_recurring').default(false).notNull(),
		recurrenceRule: jsonb('recurrence_rule').$type<RecurrenceRule>(),
		parentTransactionId: uuid('parent_transaction_id'), // For recurring instances

		// Status
		isPending: boolean('is_pending').default(false).notNull(),
		isReconciled: boolean('is_reconciled').default(false).notNull(),

		// Tags (stored as array)
		tags: jsonb('tags').$type<string[]>().default([]),

		// Attachments (receipt images, etc.)
		attachments: jsonb('attachments').$type<string[]>().default([]),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('transactions_user_idx').on(table.userId),
		accountIdx: index('transactions_account_idx').on(table.accountId),
		categoryIdx: index('transactions_category_idx').on(table.categoryId),
		dateIdx: index('transactions_date_idx').on(table.date),
		typeIdx: index('transactions_type_idx').on(table.type),
		recurringIdx: index('transactions_recurring_idx').on(table.isRecurring),
		parentIdx: index('transactions_parent_idx').on(table.parentTransactionId),
	})
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
