/**
 * @mana/feedback — Public-Community Feedback Hub
 *
 * Single source of truth for all user-facing feedback in Mana:
 *  - Anonymized by display-name pseudonym ("Wachsame Eule #4528")
 *  - Slack-style emoji reactions (👍 ❤️ 🚀 🤔 🎉) instead of binary votes
 *  - Public read endpoints under /api/v1/public/feedback (no auth)
 *  - Authenticated submit + react under /api/v1/feedback (Bearer)
 */

// Types
export {
	type FeedbackCategory,
	type FeedbackStatus,
	type Feedback,
	type PublicFeedbackItem,
	type ReactionEmoji,
	REACTION_EMOJIS,
	REACTION_LABELS,
	FEEDBACK_CATEGORY_LABELS,
	FEEDBACK_STATUS_CONFIG,
} from './feedback';

export {
	type CreateFeedbackInput,
	type FeedbackQueryParams,
	type FeedbackResponse,
	type FeedbackListResponse,
	type PublicFeedListResponse,
	type PublicItemResponse,
	type ReactionResponse,
	type AdminPatchInput,
	type ReactInput,
	type VoteResponse,
} from './api';

// Services
export { createFeedbackService, type FeedbackService } from './createFeedbackService';
export {
	createPublicFeedbackService,
	type PublicFeedbackService,
} from './createPublicFeedbackService';
export type { FeedbackServiceConfig, PublicFeedbackServiceConfig } from './types';

// UI Components
export { default as FeedbackPage } from './FeedbackPage.svelte';
export { default as FeedbackForm } from './FeedbackForm.svelte';
export { default as FeedbackList } from './FeedbackList.svelte';
export { default as FeedbackCard } from './FeedbackCard.svelte';
export { default as VoteButton } from './VoteButton.svelte';
export { default as ReactionBar } from './ReactionBar.svelte';
export { default as StatusBadge } from './StatusBadge.svelte';
