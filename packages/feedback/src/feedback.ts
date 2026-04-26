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
	voteCount: number;
	userHasVoted: boolean;
	deviceInfo?: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
	publishedAt?: string;
	completedAt?: string;
}

export interface FeedbackVote {
	id: string;
	feedbackId: string;
	userId: string;
	createdAt: string;
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
