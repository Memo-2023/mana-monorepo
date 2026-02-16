import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
