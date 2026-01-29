import {
	pgTable,
	uuid,
	timestamp,
	varchar,
	text,
	integer,
	index,
} from 'drizzle-orm/pg-core';

export type SkillBranch =
	| 'intellect'
	| 'body'
	| 'creativity'
	| 'social'
	| 'practical'
	| 'mindset'
	| 'custom';

export const skills = pgTable(
	'skills',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),

		// Content
		name: varchar('name', { length: 200 }).notNull(),
		description: text('description'),
		branch: varchar('branch', { length: 20 }).notNull().$type<SkillBranch>(),
		parentId: uuid('parent_id'),
		icon: varchar('icon', { length: 50 }).default('star'),
		color: varchar('color', { length: 20 }),

		// Progress
		currentXp: integer('current_xp').default(0).notNull(),
		totalXp: integer('total_xp').default(0).notNull(),
		level: integer('level').default(0).notNull(),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('skills_user_idx').on(table.userId),
		branchIdx: index('skills_branch_idx').on(table.userId, table.branch),
		parentIdx: index('skills_parent_idx').on(table.parentId),
		levelIdx: index('skills_level_idx').on(table.userId, table.level),
	})
);

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
