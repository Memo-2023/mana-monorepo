import { uuid, text, date, integer, decimal, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { cardsSchema } from './schema.js';

export const dailyProgress = cardsSchema.table(
	'daily_progress',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		date: date('date').notNull(),
		cardsStudied: integer('cards_studied').default(0).notNull(),
		timeSpentMinutes: integer('time_spent_minutes').default(0).notNull(),
		accuracyPercentage: decimal('accuracy_percentage', { precision: 5, scale: 2 })
			.default('0')
			.notNull(),
		decksStudied: text('decks_studied').array().default([]),
		sessionsCompleted: integer('sessions_completed').default(0).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('idx_daily_progress_user_id').on(table.userId),
		index('idx_daily_progress_date').on(table.date),
		unique('unique_user_date').on(table.userId, table.date),
	]
);

export type DailyProgress = typeof dailyProgress.$inferSelect;
export type NewDailyProgress = typeof dailyProgress.$inferInsert;
