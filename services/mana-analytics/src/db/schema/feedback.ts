import {
	pgSchema,
	uuid,
	text,
	timestamp,
	integer,
	boolean,
	jsonb,
	index,
	unique,
	pgEnum,
} from 'drizzle-orm/pg-core';

export const feedbackSchema = pgSchema('feedback');

// Enum values must mirror @mana/feedback's FeedbackCategory / FeedbackStatus
// unions exactly. Renames or additions need a hand-authored SQL migration
// under services/mana-analytics/drizzle/ (drizzle-kit push can't safely
// rename enum values).
export const feedbackCategoryEnum = pgEnum('feedback_category', [
	'bug',
	'feature',
	'improvement',
	'question',
	'praise',
	'onboarding-wish',
	'other',
]);

export const feedbackStatusEnum = pgEnum('feedback_status', [
	'submitted',
	'under_review',
	'planned',
	'in_progress',
	'completed',
	'declined',
]);

export const userFeedback = feedbackSchema.table(
	'user_feedback',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		appId: text('app_id').notNull(),
		title: text('title'),
		feedbackText: text('feedback_text').notNull(),
		category: feedbackCategoryEnum('category').default('other').notNull(),
		status: feedbackStatusEnum('status').default('submitted').notNull(),
		isPublic: boolean('is_public').default(true).notNull(),
		adminResponse: text('admin_response'),
		voteCount: integer('vote_count').default(0).notNull(),
		deviceInfo: jsonb('device_info'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('feedback_user_id_idx').on(table.userId),
		appIdIdx: index('feedback_app_id_idx').on(table.appId),
		statusIdx: index('feedback_status_idx').on(table.status),
	})
);

export const feedbackVotes = feedbackSchema.table(
	'feedback_votes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		feedbackId: uuid('feedback_id')
			.notNull()
			.references(() => userFeedback.id, { onDelete: 'cascade' }),
		userId: text('user_id').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		feedbackUserUnique: unique('feedback_votes_unique').on(table.feedbackId, table.userId),
	})
);

export type Feedback = typeof userFeedback.$inferSelect;
export type FeedbackVote = typeof feedbackVotes.$inferSelect;
