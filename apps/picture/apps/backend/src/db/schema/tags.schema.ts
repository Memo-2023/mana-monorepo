import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const tags = pgTable('tags', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull().unique(),
	color: text('color'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export const imageTags = pgTable('image_tags', {
	id: uuid('id').primaryKey().defaultRandom(),
	imageId: uuid('image_id').notNull(),
	tagId: uuid('tag_id').notNull(),
	addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ImageTag = typeof imageTags.$inferSelect;
export type NewImageTag = typeof imageTags.$inferInsert;
