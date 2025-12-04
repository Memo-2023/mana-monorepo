import { pgTable, uuid, text, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';

export const sequences = pgTable('sequences', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
	name: text('name').notNull(),
	moodIds: jsonb('mood_ids').notNull().$type<string[]>(),
	duration: integer('duration').default(30),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
});

export type Sequence = typeof sequences.$inferSelect;
export type NewSequence = typeof sequences.$inferInsert;
