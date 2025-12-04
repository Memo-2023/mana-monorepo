import {
	pgTable,
	uuid,
	timestamp,
	varchar,
	text,
	boolean,
	decimal,
	integer,
	index,
} from 'drizzle-orm/pg-core';

export type AccountType =
	| 'checking'
	| 'savings'
	| 'credit_card'
	| 'cash'
	| 'investment'
	| 'loan'
	| 'other';

export const accounts = pgTable(
	'accounts',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').notNull(),

		// Basic info
		name: varchar('name', { length: 100 }).notNull(),
		type: varchar('type', { length: 20 }).notNull().$type<AccountType>(),

		// Balance
		balance: decimal('balance', { precision: 15, scale: 2 }).default('0').notNull(),
		currency: varchar('currency', { length: 3 }).default('EUR').notNull(),

		// Display
		color: varchar('color', { length: 7 }).default('#3B82F6'),
		icon: varchar('icon', { length: 50 }).default('wallet'),

		// Status
		isArchived: boolean('is_archived').default(false).notNull(),
		includeInTotal: boolean('include_in_total').default(true).notNull(),

		// Ordering
		order: integer('order').default(0).notNull(),

		// Metadata
		description: text('description'),
		institutionName: varchar('institution_name', { length: 100 }),
		accountNumber: varchar('account_number', { length: 50 }), // Last 4 digits only

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('accounts_user_idx').on(table.userId),
		typeIdx: index('accounts_type_idx').on(table.type),
		orderIdx: index('accounts_order_idx').on(table.order),
	})
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
