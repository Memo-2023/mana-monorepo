import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const worldClocks = pgTable('world_clocks', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').notNull(),
	timezone: varchar('timezone', { length: 100 }).notNull(), // IANA timezone e.g. 'America/New_York'
	cityName: varchar('city_name', { length: 255 }).notNull(),
	sortOrder: integer('sort_order').default(0).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type WorldClock = typeof worldClocks.$inferSelect;
export type NewWorldClock = typeof worldClocks.$inferInsert;
