import { pgTable, uuid, text, timestamp, index, unique } from 'drizzle-orm/pg-core';

export const favorites = pgTable(
	'favorites',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		mediaId: text('media_id').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('favorites_user_id_idx').on(table.userId),
		index('favorites_media_id_idx').on(table.mediaId),
		unique('favorites_user_media_unique').on(table.userId, table.mediaId),
	]
);

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
