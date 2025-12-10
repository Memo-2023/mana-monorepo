import { pgTable, varchar, text, uuid, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Central tags table for all Manacore applications.
 * Tags created here can be used in Todo, Calendar, Contacts, and other apps.
 */
export const tags = pgTable(
	'tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		name: varchar('name', { length: 100 }).notNull(),
		color: varchar('color', { length: 7 }).default('#3B82F6'),
		icon: varchar('icon', { length: 50 }), // Optional: Phosphor Icon name
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [
		index('tags_user_idx').on(table.userId),
		unique('tags_user_name_unique').on(table.userId, table.name),
	]
);

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
