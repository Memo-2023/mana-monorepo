import { pgTable, uuid, timestamp, varchar, boolean, integer, index } from 'drizzle-orm/pg-core';

export type CategoryType = 'income' | 'expense';

export const categories = pgTable(
	'categories',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').notNull(),

		// Basic info
		name: varchar('name', { length: 100 }).notNull(),
		type: varchar('type', { length: 10 }).notNull().$type<CategoryType>(),

		// Hierarchy (for subcategories)
		parentId: uuid('parent_id'),

		// Display
		color: varchar('color', { length: 7 }).default('#6B7280'),
		icon: varchar('icon', { length: 50 }).default('tag'),

		// Ordering
		order: integer('order').default(0).notNull(),

		// Status
		isSystem: boolean('is_system').default(false).notNull(), // For default categories
		isArchived: boolean('is_archived').default(false).notNull(),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('categories_user_idx').on(table.userId),
		typeIdx: index('categories_type_idx').on(table.type),
		parentIdx: index('categories_parent_idx').on(table.parentId),
		orderIdx: index('categories_order_idx').on(table.order),
	})
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
