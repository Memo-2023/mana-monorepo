import { pgTable, uuid, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core';

export const favorites = pgTable(
	'favorites',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		quoteId: varchar('quote_id', { length: 100 }).notNull(), // References static quote ID from shared package
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		uniqueUserQuote: unique().on(table.userId, table.quoteId),
	})
);

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
