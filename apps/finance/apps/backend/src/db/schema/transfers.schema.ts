import { pgTable, uuid, timestamp, text, decimal, date, index } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.schema';

export const transfers = pgTable(
	'transfers',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').notNull(),

		// Accounts
		fromAccountId: uuid('from_account_id')
			.references(() => accounts.id, { onDelete: 'cascade' })
			.notNull(),
		toAccountId: uuid('to_account_id')
			.references(() => accounts.id, { onDelete: 'cascade' })
			.notNull(),

		// Amount
		amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),

		// Date
		date: date('date').notNull(),

		// Description
		description: text('description'),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('transfers_user_idx').on(table.userId),
		fromAccountIdx: index('transfers_from_account_idx').on(table.fromAccountId),
		toAccountIdx: index('transfers_to_account_idx').on(table.toAccountId),
		dateIdx: index('transfers_date_idx').on(table.date),
	})
);

export type Transfer = typeof transfers.$inferSelect;
export type NewTransfer = typeof transfers.$inferInsert;
