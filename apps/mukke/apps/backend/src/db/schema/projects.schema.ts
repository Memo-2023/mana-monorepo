import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { songs } from './songs.schema';

export const projects = pgTable('projects', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	songId: uuid('song_id').references(() => songs.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
