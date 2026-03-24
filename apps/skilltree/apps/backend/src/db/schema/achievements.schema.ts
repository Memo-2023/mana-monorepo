import {
	pgTable,
	uuid,
	timestamp,
	varchar,
	text,
	integer,
	boolean,
	index,
	jsonb,
} from 'drizzle-orm/pg-core';

export type AchievementCategory =
	| 'xp'
	| 'skills'
	| 'levels'
	| 'activities'
	| 'streak'
	| 'branches'
	| 'special';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const achievements = pgTable('achievements', {
	id: varchar('id', { length: 50 }).primaryKey(), // e.g. 'first_activity', 'streak_7'
	name: varchar('name', { length: 200 }).notNull(),
	description: text('description').notNull(),
	icon: varchar('icon', { length: 50 }).notNull().default('trophy'),
	category: varchar('category', { length: 20 }).notNull().$type<AchievementCategory>(),
	rarity: varchar('rarity', { length: 20 }).notNull().$type<AchievementRarity>(),
	xpReward: integer('xp_reward').default(0).notNull(),
	sortOrder: integer('sort_order').default(0).notNull(),
	condition: jsonb('condition').notNull(), // { type: 'total_xp', threshold: 1000 }
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;

export const userAchievements = pgTable(
	'user_achievements',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		achievementId: varchar('achievement_id', { length: 50 })
			.references(() => achievements.id, { onDelete: 'cascade' })
			.notNull(),
		unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow().notNull(),
		progress: integer('progress').default(0).notNull(), // current progress toward threshold
	},
	(table) => ({
		userIdx: index('user_achievements_user_idx').on(table.userId),
		achievementIdx: index('user_achievements_achievement_idx').on(table.achievementId),
		uniqueUserAchievement: index('user_achievements_unique_idx').on(
			table.userId,
			table.achievementId
		),
	})
);

export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
