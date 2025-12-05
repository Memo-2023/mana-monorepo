import { pgTable, uuid, varchar, integer, timestamp, unique } from 'drizzle-orm/pg-core';

export const votes = pgTable(
	'votes',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		softwareId: varchar('software_id', { length: 255 }).notNull(),
		metric: varchar('metric', { length: 50 }).notNull(),
		rating: integer('rating').notNull(),
		ipHash: varchar('ip_hash', { length: 255 }).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => ({
		uniqueVote: unique().on(table.softwareId, table.metric, table.ipHash),
	})
);

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
