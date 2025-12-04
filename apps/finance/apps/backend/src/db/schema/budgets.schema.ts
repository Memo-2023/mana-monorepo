import {
	pgTable,
	uuid,
	timestamp,
	varchar,
	decimal,
	integer,
	boolean,
	index,
} from 'drizzle-orm/pg-core';
import { categories } from './categories.schema';

export const budgets = pgTable(
	'budgets',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').notNull(),

		// Category (null = overall budget)
		categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }),

		// Period
		month: integer('month').notNull(), // 1-12
		year: integer('year').notNull(),

		// Amount
		amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
		currency: varchar('currency', { length: 3 }).default('EUR').notNull(),

		// Alert settings
		alertThreshold: decimal('alert_threshold', { precision: 5, scale: 2 })
			.default('0.80')
			.notNull(), // 80%
		alertEnabled: boolean('alert_enabled').default(true).notNull(),

		// Rollover (unused budget carries to next month)
		rolloverEnabled: boolean('rollover_enabled').default(false).notNull(),
		rolloverAmount: decimal('rollover_amount', { precision: 15, scale: 2 }).default('0').notNull(),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('budgets_user_idx').on(table.userId),
		categoryIdx: index('budgets_category_idx').on(table.categoryId),
		periodIdx: index('budgets_period_idx').on(table.year, table.month),
	})
);

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
