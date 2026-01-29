import {
	pgTable,
	uuid,
	timestamp,
	varchar,
	text,
	integer,
	index,
} from 'drizzle-orm/pg-core';
import { skills } from './skills.schema';

export const activities = pgTable(
	'activities',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		skillId: uuid('skill_id')
			.references(() => skills.id, { onDelete: 'cascade' })
			.notNull(),

		// Activity details
		xpEarned: integer('xp_earned').notNull(),
		description: varchar('description', { length: 500 }).notNull(),
		duration: integer('duration'), // in minutes

		// Timestamp
		timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('activities_user_idx').on(table.userId),
		skillIdx: index('activities_skill_idx').on(table.skillId),
		timestampIdx: index('activities_timestamp_idx').on(table.userId, table.timestamp),
	})
);

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
