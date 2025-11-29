import {
	pgSchema,
	uuid,
	text,
	timestamp,
	boolean,
	jsonb,
	integer,
	index,
	pgEnum,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema';

export const feedbackSchema = pgSchema('feedback');

// Category enum
export const feedbackCategoryEnum = pgEnum('feedback_category', [
	'bug',
	'feature',
	'improvement',
	'question',
	'other',
]);

// Status enum
export const feedbackStatusEnum = pgEnum('feedback_status', [
	'submitted',
	'under_review',
	'planned',
	'in_progress',
	'completed',
	'declined',
]);

// User feedback table
export const userFeedback = feedbackSchema.table(
	'user_feedback',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		appId: text('app_id').notNull(), // 'chat', 'picture', 'zitare', etc.

		// Content
		title: text('title'),
		feedbackText: text('feedback_text').notNull(),
		category: feedbackCategoryEnum('category').default('feature').notNull(),

		// Status & Publishing
		status: feedbackStatusEnum('status').default('submitted').notNull(),
		isPublic: boolean('is_public').default(false).notNull(),
		adminResponse: text('admin_response'),

		// Voting (denormalized for performance)
		voteCount: integer('vote_count').default(0).notNull(),

		// Metadata
		deviceInfo: jsonb('device_info'),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
		publishedAt: timestamp('published_at', { withTimezone: true }),
		completedAt: timestamp('completed_at', { withTimezone: true }),
	},
	(table) => ({
		userIdx: index('feedback_user_idx').on(table.userId),
		appIdx: index('feedback_app_idx').on(table.appId),
		publicIdx: index('feedback_public_idx').on(table.isPublic),
		statusIdx: index('feedback_status_idx').on(table.status),
		createdAtIdx: index('feedback_created_at_idx').on(table.createdAt),
	})
);

// Feedback votes table
export const feedbackVotes = feedbackSchema.table(
	'feedback_votes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		feedbackId: uuid('feedback_id')
			.references(() => userFeedback.id, { onDelete: 'cascade' })
			.notNull(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		uniqueVote: uniqueIndex('feedback_vote_unique').on(table.feedbackId, table.userId),
		feedbackIdx: index('feedback_votes_feedback_idx').on(table.feedbackId),
	})
);
