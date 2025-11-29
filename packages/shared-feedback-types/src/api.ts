/**
 * API request/response types for feedback
 */

import type { Feedback, FeedbackCategory, FeedbackStatus } from './feedback';

export interface CreateFeedbackInput {
	title?: string;
	feedbackText: string;
	category?: FeedbackCategory;
	deviceInfo?: Record<string, unknown>;
}

export interface FeedbackQueryParams {
	appId?: string;
	status?: FeedbackStatus;
	category?: FeedbackCategory;
	sort?: 'votes' | 'recent';
	limit?: number;
	offset?: number;
}

export interface FeedbackResponse {
	success: boolean;
	feedback?: Feedback;
	error?: string;
}

export interface FeedbackListResponse {
	success: boolean;
	items: Feedback[];
	total: number;
	error?: string;
}

export interface VoteResponse {
	success: boolean;
	newVoteCount: number;
	userHasVoted: boolean;
	error?: string;
}
