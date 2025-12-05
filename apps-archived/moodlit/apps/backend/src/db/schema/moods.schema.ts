import { pgTable, uuid, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';

export const moods = pgTable('moods', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
	name: text('name').notNull(),
	colors: jsonb('colors').notNull().$type<string[]>(),
	animation: text('animation'),
	isDefault: boolean('is_default').default(false),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
});

export type Mood = typeof moods.$inferSelect;
export type NewMood = typeof moods.$inferInsert;
