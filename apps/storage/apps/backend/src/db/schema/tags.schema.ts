import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { fileTags } from './file-tags.schema';

export const tags = pgTable('tags', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: varchar('user_id', { length: 255 }).notNull(),

	name: varchar('name', { length: 50 }).notNull(),
	color: varchar('color', { length: 20 }),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
	fileTags: many(fileTags),
}));

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
