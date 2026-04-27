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
	type AnyPgColumn,
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
		// Public-community fields (Phase 2.1):
		// `display_hash` = SHA256(userId + serviceKey), never exposed.
		// `display_name` = deterministic Tier-pseudonym derived from hash.
		// Server stamps both on insert; clients receive only display_name.
		displayHash: text('display_hash'),
		displayName: text('display_name'),
		// `module_context` is set by inline FeedbackHook submissions so the
		// public feed can filter / badge by module ('todo', 'notes', …).
		moduleContext: text('module_context'),
		// `parent_id` enables 1-level reply threading on feedback items.
		parentId: uuid('parent_id').references((): AnyPgColumn => userFeedback.id, {
			onDelete: 'set null',
		}),
		// Cached per-emoji counter map, e.g. {"👍": 12, "❤️": 4, "🚀": 2}.
		// Source of truth lives in `feedback_reactions`; this column is
		// recomputed on every react/unreact for cheap reads.
		reactions: jsonb('reactions').default({}).notNull(),
		// Cached sort score (weighted reactions sum). Sort the public feed
		// on this column instead of recomputing per-row from `reactions`.
		score: integer('score').default(0).notNull(),
		deviceInfo: jsonb('device_info'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('feedback_user_id_idx').on(table.userId),
		appIdIdx: index('feedback_app_id_idx').on(table.appId),
		statusIdx: index('feedback_status_idx').on(table.status),
		displayHashIdx: index('feedback_display_hash_idx').on(table.displayHash),
		moduleContextIdx: index('feedback_module_context_idx').on(table.moduleContext),
		parentIdIdx: index('feedback_parent_id_idx').on(table.parentId),
		scoreIdx: index('feedback_score_idx').on(table.score),
	})
);

// Reactions table: one row per (item, user, emoji). Slack-pattern:
// a user can stack multiple emojis on the same item. Aggregated counts
// are mirrored into `user_feedback.reactions` for cheap reads.
export const feedbackReactions = feedbackSchema.table(
	'feedback_reactions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		feedbackId: uuid('feedback_id')
			.notNull()
			.references(() => userFeedback.id, { onDelete: 'cascade' }),
		userId: text('user_id').notNull(),
		emoji: text('emoji').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		uniq: unique('feedback_reactions_unique').on(table.feedbackId, table.userId, table.emoji),
		feedbackIdx: index('feedback_reactions_feedback_idx').on(table.feedbackId),
	})
);

// Per-user notification inbox. Server enqueues rows whenever a feedback
// status changes (author + reactioners get a row each). Web polls
// /api/v1/feedback/me/notifications and renders unread ones as toasts.
// `read_at IS NULL` is the inbox; the partial index keeps fetches O(log n).
export const feedbackNotifications = feedbackSchema.table(
	'feedback_notifications',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		feedbackId: uuid('feedback_id')
			.notNull()
			.references(() => userFeedback.id, { onDelete: 'cascade' }),
		// 'status_planned' | 'status_in_progress' | 'status_completed'
		// | 'status_declined' | 'admin_response' | 'reactioner_bonus'
		// (when their reacted-on item shipped — keeps loop closed for
		//  Sympathisanten, not just original authors).
		kind: text('kind').notNull(),
		title: text('title').notNull(),
		body: text('body'),
		creditsAwarded: integer('credits_awarded').default(0).notNull(),
		readAt: timestamp('read_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		unreadIdx: index('feedback_notifications_unread_idx').on(table.userId, table.createdAt),
		feedbackIdx: index('feedback_notifications_feedback_idx').on(table.feedbackId),
	})
);

// Append-only log of community-credit grants. Used as a sliding-window
// rate-limit counter ("max 10 grants per user per 24h") and as an audit
// trail. Cleanup of rows older than 7d is handled by a nightly cron.
export const feedbackGrantLog = feedbackSchema.table(
	'feedback_grant_log',
	{
		userId: text('user_id').notNull(),
		grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
		reason: text('reason').notNull(),
	},
	(table) => ({
		recentIdx: index('feedback_grant_log_recent_idx').on(table.userId, table.grantedAt),
	})
);

export type Feedback = typeof userFeedback.$inferSelect;
export type FeedbackReaction = typeof feedbackReactions.$inferSelect;
export type FeedbackNotification = typeof feedbackNotifications.$inferSelect;
