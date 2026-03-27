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
import { tagGroups } from './tag-groups';

export const tags = pgTable(
	'tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		name: varchar('name', { length: 100 }).notNull(),
		color: varchar('color', { length: 7 }).default('#3B82F6'),
		icon: varchar('icon', { length: 50 }),
		groupId: uuid('group_id').references(() => tagGroups.id, { onDelete: 'set null' }),
		sortOrder: integer('sort_order').default(0).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [
		index('tags_user_idx').on(table.userId),
		index('tags_group_idx').on(table.groupId),
		unique('tags_user_name_unique').on(table.userId, table.name),
	]
);

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
