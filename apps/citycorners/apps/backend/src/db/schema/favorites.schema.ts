import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { locations } from './locations.schema';

export const favorites = pgTable(
	'favorites',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		locationId: uuid('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		uniqueUserLocation: unique().on(table.userId, table.locationId),
	})
);

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
