import { text, integer, decimal, date, timestamp, index } from 'drizzle-orm/pg-core';
import { cardsSchema } from './schema';

export const userStats = cardsSchema.table(
	'user_stats',
	{
		userId: text('user_id').primaryKey(),
		totalWins: integer('total_wins').default(0).notNull(),
		totalSessions: integer('total_sessions').default(0).notNull(),
		totalCardsStudied: integer('total_cards_studied').default(0).notNull(),
		totalTimeSeconds: integer('total_time_seconds').default(0).notNull(),
		averageAccuracy: decimal('average_accuracy', { precision: 5, scale: 2 }).default('0').notNull(),
		streakDays: integer('streak_days').default(0).notNull(),
		longestStreak: integer('longest_streak').default(0).notNull(),
		lastStudyDate: date('last_study_date'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('idx_user_stats_total_wins').on(table.totalWins),
		index('idx_user_stats_streak_days').on(table.streakDays),
	]
);

export type UserStats = typeof userStats.$inferSelect;
export type NewUserStats = typeof userStats.$inferInsert;
