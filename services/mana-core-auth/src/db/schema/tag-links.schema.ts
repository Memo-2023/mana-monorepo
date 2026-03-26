import { pgTable, varchar, text, uuid, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { tags } from './tags.schema';

export const tagLinks = pgTable(
	'tag_links',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		tagId: uuid('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' }),
		appId: varchar('app_id', { length: 50 }).notNull(),
		entityId: varchar('entity_id', { length: 255 }).notNull(),
		entityType: varchar('entity_type', { length: 100 }).notNull(),
		userId: text('user_id').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => [
		index('tag_links_tag_idx').on(table.tagId),
		index('tag_links_entity_idx').on(table.appId, table.entityId),
		index('tag_links_user_app_idx').on(table.userId, table.appId),
		unique('tag_links_unique').on(table.tagId, table.appId, table.entityId),
	]
);

export type TagLink = typeof tagLinks.$inferSelect;
export type NewTagLink = typeof tagLinks.$inferInsert;
