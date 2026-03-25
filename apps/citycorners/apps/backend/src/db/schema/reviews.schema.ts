import { pgTable, uuid, text, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { locations } from './locations.schema';

export const reviews = pgTable(
	'reviews',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		locationId: uuid('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'cascade' }),
		rating: integer('rating').notNull(),
		comment: text('comment'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		uniqueUserLocation: unique().on(table.userId, table.locationId),
	})
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
