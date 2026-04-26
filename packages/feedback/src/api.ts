/**
 * API request/response types for feedback.
 */

import type {
	Feedback,
	FeedbackCategory,
	FeedbackStatus,
	PublicFeedbackItem,
	ReactionEmoji,
} from './feedback';

export interface CreateFeedbackInput {
	title?: string;
	feedbackText: string;
	category?: FeedbackCategory;
	/**
	 * Whether the submission shows up in the public community list.
	 * Defaults to `true` server-side. Set `false` for private intake
	 * categories like `onboarding-wish` (private mode) or `churn-feedback`.
	 */
	isPublic?: boolean;
	/** Module that triggered the inline FeedbackHook submission. */
	moduleContext?: string;
	/** If set, submission is a reply to that feedback item. */
	parentId?: string;
	deviceInfo?: Record<string, unknown>;
}

export interface FeedbackQueryParams {
	appId?: string;
	moduleContext?: string;
	status?: FeedbackStatus;
	category?: FeedbackCategory;
	sort?: 'score' | 'recent';
	limit?: number;
	offset?: number;
}

export interface FeedbackResponse {
	success?: boolean;
	feedback?: Feedback;
	error?: string;
	[key: string]: unknown;
}

export interface FeedbackListResponse {
	success?: boolean;
	items: Feedback[];
	total?: number;
	error?: string;
}

export interface PublicFeedListResponse {
	items: PublicFeedbackItem[];
}

export interface PublicItemResponse {
	item: PublicFeedbackItem;
	replies: PublicFeedbackItem[];
}

export interface ReactionResponse {
	reactions: Partial<Record<string, number>>;
	score: number;
	userHasReacted: boolean;
}

export interface AdminPatchInput {
	status?: FeedbackStatus;
	adminResponse?: string;
	isPublic?: boolean;
}

export type ReactInput = { emoji: ReactionEmoji };

export interface VoteResponse {
	success: boolean;
	newVoteCount?: number;
	userHasVoted?: boolean;
	error?: string;
}
