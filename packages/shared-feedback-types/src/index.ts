/**
 * Shared feedback types for Manacore monorepo
 *
 * This package contains TypeScript types for feedback submissions,
 * voting, and API contracts.
 */

// Feedback types
export {
	type FeedbackCategory,
	type FeedbackStatus,
	type Feedback,
	type FeedbackVote,
	FEEDBACK_CATEGORY_LABELS,
	FEEDBACK_STATUS_CONFIG,
} from './feedback';

// API types
export {
	type CreateFeedbackInput,
	type FeedbackQueryParams,
	type FeedbackResponse,
	type FeedbackListResponse,
	type VoteResponse,
} from './api';
