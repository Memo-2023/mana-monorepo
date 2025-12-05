import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { items } from './items.schema';

export const categories = pgTable('categories', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	name: varchar('name', { length: 100 }).notNull(),
	icon: varchar('icon', { length: 50 }),
	color: varchar('color', { length: 20 }),
	parentCategoryId: uuid('parent_category_id'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
	parent: one(categories, {
		fields: [categories.parentCategoryId],
		references: [categories.id],
		relationName: 'categoryHierarchy',
	}),
	children: many(categories, { relationName: 'categoryHierarchy' }),
	items: many(items),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
