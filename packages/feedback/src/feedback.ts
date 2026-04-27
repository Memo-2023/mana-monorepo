/**
 * Core feedback types — Single source of truth for the @mana/feedback hub.
 *
 * Mana-analytics' Postgres enums (`feedback.feedback_category`,
 * `feedback.feedback_status`) MUST mirror these literal unions exactly.
 * If you add or rename a value here, also write a SQL migration under
 * services/mana-analytics/drizzle/.
 */

export type FeedbackCategory =
	| 'bug'
	| 'feature'
	| 'improvement'
	| 'question'
	| 'praise'
	| 'onboarding-wish'
	| 'other';

export type FeedbackStatus =
	| 'submitted'
	| 'under_review'
	| 'planned'
	| 'in_progress'
	| 'completed'
	| 'declined';

/**
 * Whitelisted reaction emojis — must mirror REACTION_WEIGHTS in
 * services/mana-analytics/src/services/feedback.ts. Server rejects
 * any emoji not in this list.
 */
export const REACTION_EMOJIS = ['👍', '❤️', '🚀', '🤔', '🎉'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export const REACTION_LABELS: Record<ReactionEmoji, string> = {
	'👍': 'Will ich auch',
	'❤️': 'Liebe ich',
	'🚀': 'Ship it',
	'🤔': 'Macht mich nachdenklich',
	'🎉': 'Feier',
};

/**
 * Anonymized feedback item as it appears in the public community feed.
 * Never contains userId or other identifying fields — only the
 * persistent display_name pseudonym ("Wachsame Eule #4528").
 */
export interface PublicFeedbackItem {
	id: string;
	appId: string;
	title: string | null;
	feedbackText: string;
	category: FeedbackCategory;
	status: FeedbackStatus;
	moduleContext: string | null;
	parentId: string | null;
	displayName: string;
	reactions: Partial<Record<string, number>>;
	score: number;
	adminResponse: string | null;
	createdAt: string;
	updatedAt: string;
	/** Auth-only: which emojis the requesting user has reacted with. */
	myReactions?: string[];
}

/**
 * Inbox notification — server enqueues one row per status-transition
 * for the author + each reactioner-with-👍/🚀-on-completed. Web polls
 * /me/notifications and renders unread ones as toasts.
 */
export type NotificationKind =
	| 'status_planned'
	| 'status_in_progress'
	| 'status_completed'
	| 'status_declined'
	| 'status_under_review'
	| 'status_submitted'
	| 'admin_response'
	| 'reactioner_bonus';

export interface FeedbackNotification {
	id: string;
	userId: string;
	feedbackId: string;
	kind: NotificationKind;
	title: string;
	body: string | null;
	creditsAwarded: number;
	readAt: string | null;
	createdAt: string;
}

/**
 * Authenticated, full feedback record (own submissions / admin views).
 * Includes the user-private fields the public feed redacts.
 */
export interface Feedback {
	id: string;
	userId: string;
	appId: string;
	title?: string;
	feedbackText: string;
	category: FeedbackCategory;
	status: FeedbackStatus;
	isPublic: boolean;
	adminResponse?: string;
	displayHash?: string;
	displayName?: string;
	moduleContext?: string;
	parentId?: string;
	reactions?: Partial<Record<string, number>>;
	score?: number;
	deviceInfo?: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
	publishedAt?: string;
	completedAt?: string;
}

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
	bug: 'Bug',
	feature: 'Feature',
	improvement: 'Verbesserung',
	question: 'Frage',
	praise: 'Lob',
	'onboarding-wish': 'Was ich mir wünsche',
	other: 'Sonstiges',
};

export const FEEDBACK_STATUS_CONFIG: Record<
	FeedbackStatus,
	{ label: string; color: string; icon: string }
> = {
	submitted: { label: 'Eingereicht', color: '#999', icon: 'clock' },
	under_review: { label: 'Wird geprüft', color: '#3498DB', icon: 'eye' },
	planned: { label: 'Geplant', color: '#9B59B6', icon: 'calendar' },
	in_progress: { label: 'In Arbeit', color: '#F39C12', icon: 'loader' },
	completed: { label: 'Umgesetzt', color: '#27AE60', icon: 'check-circle' },
	declined: { label: 'Abgelehnt', color: '#E74C3C', icon: 'x-circle' },
};
