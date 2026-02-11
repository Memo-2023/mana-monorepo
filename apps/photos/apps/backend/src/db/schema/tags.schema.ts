import { pgTable, uuid, text, varchar, timestamp, index, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const tags = pgTable(
	'tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		name: varchar('name', { length: 50 }).notNull(),
		color: varchar('color', { length: 20 }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('tags_user_id_idx').on(table.userId)]
);

export const photoTags = pgTable(
	'photo_tags',
	{
		mediaId: text('media_id').notNull(),
		tagId: uuid('tag_id')
			.references(() => tags.id, { onDelete: 'cascade' })
			.notNull(),
		addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.mediaId, table.tagId] }),
	})
);

export const tagsRelations = relations(tags, ({ many }) => ({
	photoTags: many(photoTags),
}));

export const photoTagsRelations = relations(photoTags, ({ one }) => ({
	tag: one(tags, {
		fields: [photoTags.tagId],
		references: [tags.id],
	}),
}));

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type PhotoTag = typeof photoTags.$inferSelect;
export type NewPhotoTag = typeof photoTags.$inferInsert;
