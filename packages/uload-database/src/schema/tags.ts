import { pgTable, uuid, text, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { links } from './links.js';

export const tags = pgTable(
	'tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		color: text('color'),
		icon: text('icon'),
		isPublic: boolean('is_public').default(false),
		usageCount: integer('usage_count').default(0),
		userId: text('user_id').references(() => users.id),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [index('tags_user_id_idx').on(table.userId), index('tags_slug_idx').on(table.slug)]
);

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export const linkTags = pgTable(
	'link_tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		linkId: uuid('link_id')
			.references(() => links.id, { onDelete: 'cascade' })
			.notNull(),
		tagId: uuid('tag_id')
			.references(() => tags.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => [
		index('link_tags_link_id_idx').on(table.linkId),
		index('link_tags_tag_id_idx').on(table.tagId),
		index('link_tags_unique_idx').on(table.linkId, table.tagId),
	]
);

export type LinkTag = typeof linkTags.$inferSelect;
export type NewLinkTag = typeof linkTags.$inferInsert;
