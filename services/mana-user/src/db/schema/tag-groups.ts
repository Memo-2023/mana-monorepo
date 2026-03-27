import {
	pgTable,
	varchar,
	text,
	uuid,
	timestamp,
	index,
	unique,
	integer,
} from 'drizzle-orm/pg-core';

export const tagGroups = pgTable(
	'tag_groups',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		name: varchar('name', { length: 100 }).notNull(),
		color: varchar('color', { length: 7 }).default('#3B82F6'),
		icon: varchar('icon', { length: 50 }),
		sortOrder: integer('sort_order').default(0).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [
		index('tag_groups_user_idx').on(table.userId),
		unique('tag_groups_user_name_unique').on(table.userId, table.name),
	]
);

export type TagGroup = typeof tagGroups.$inferSelect;
export type NewTagGroup = typeof tagGroups.$inferInsert;
