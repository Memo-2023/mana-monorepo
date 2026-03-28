/**
 * @manacore/feedback — Unified feedback package
 *
 * Consolidates shared-feedback-types + shared-feedback-service + shared-feedback-ui
 * into a single package.
 */

// Types
export {
	type FeedbackCategory,
	type FeedbackStatus,
	type Feedback,
	type FeedbackVote,
	FEEDBACK_CATEGORY_LABELS,
	FEEDBACK_STATUS_CONFIG,
} from './feedback';

export {
	type CreateFeedbackInput,
	type FeedbackQueryParams,
	type FeedbackResponse,
	type FeedbackListResponse,
	type VoteResponse,
} from './api';

// Service
export { createFeedbackService, type FeedbackService } from './createFeedbackService';
export type { FeedbackServiceConfig } from './types';

// UI Components
export { default as FeedbackPage } from './FeedbackPage.svelte';
export { default as FeedbackForm } from './FeedbackForm.svelte';
export { default as FeedbackList } from './FeedbackList.svelte';
export { default as FeedbackCard } from './FeedbackCard.svelte';
export { default as VoteButton } from './VoteButton.svelte';
export { default as StatusBadge } from './StatusBadge.svelte';
