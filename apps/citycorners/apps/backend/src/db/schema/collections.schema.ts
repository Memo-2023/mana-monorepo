import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const collections = pgTable('collections', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
	name: text('name').notNull(),
	description: text('description'),
	locationIds: jsonb('location_ids').$type<string[]>().default([]),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
