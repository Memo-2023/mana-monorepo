/**
 * Shared feedback service for Manacore monorepo
 *
 * This package provides a factory function to create feedback service
 * instances that can be used across all web and mobile apps.
 */

export { createFeedbackService, type FeedbackService } from './createFeedbackService';
export type { FeedbackServiceConfig } from './types';

// Re-export types from shared-feedback-types for convenience
export type {
	Feedback,
	FeedbackCategory,
	FeedbackStatus,
	FeedbackVote,
	CreateFeedbackInput,
	FeedbackQueryParams,
	FeedbackResponse,
	FeedbackListResponse,
	VoteResponse,
	FEEDBACK_CATEGORY_LABELS,
	FEEDBACK_STATUS_CONFIG,
} from '@manacore/shared-feedback-types';
