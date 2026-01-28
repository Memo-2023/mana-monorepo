import {
	pgTable,
	uuid,
	timestamp,
	text,
	integer,
	date,
	index,
} from 'drizzle-orm/pg-core';

export const userStats = pgTable(
	'user_stats',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull().unique(),

		// Aggregated stats
		totalXp: integer('total_xp').default(0).notNull(),
		totalSkills: integer('total_skills').default(0).notNull(),
		highestLevel: integer('highest_level').default(0).notNull(),
		streakDays: integer('streak_days').default(0).notNull(),
		lastActivityDate: date('last_activity_date'),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('user_stats_user_idx').on(table.userId),
	})
);

export type UserStat = typeof userStats.$inferSelect;
export type NewUserStat = typeof userStats.$inferInsert;
