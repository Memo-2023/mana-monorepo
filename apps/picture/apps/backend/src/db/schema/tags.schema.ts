import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { images } from './images.schema';

export const tags = pgTable('tags', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull().unique(),
	color: text('color'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export const imageTags = pgTable(
	'image_tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		imageId: uuid('image_id')
			.notNull()
			.references(() => images.id, { onDelete: 'cascade' }),
		tagId: uuid('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' }),
		addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		imageIdIdx: index('image_tags_image_id_idx').on(table.imageId),
		tagIdIdx: index('image_tags_tag_id_idx').on(table.tagId),
	})
);

export type ImageTag = typeof imageTags.$inferSelect;
export type NewImageTag = typeof imageTags.$inferInsert;
