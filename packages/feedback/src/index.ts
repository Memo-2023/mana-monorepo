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
	type FeedbackNotification,
	type NotificationKind,
	type KarmaTier,
	type PublicFeedbackItem,
	type ReactionEmoji,
	REACTION_EMOJIS,
	REACTION_LABELS,
	FEEDBACK_CATEGORY_LABELS,
	FEEDBACK_STATUS_CONFIG,
	KARMA_THRESHOLDS,
	KARMA_TIER_CONFIG,
	tierFromKarma,
} from './feedback';

export {
	type CreateFeedbackInput,
	type FeedbackQueryParams,
	type FeedbackResponse,
	type FeedbackListResponse,
	type PublicFeedListResponse,
	type PublicItemResponse,
	type EulenProfileResponse,
	type ReactionResponse,
	type AdminPatchInput,
	type ReactInput,
} from './api';

// Services
export { createFeedbackService, type FeedbackService } from './createFeedbackService';
export {
	createPublicFeedbackService,
	type PublicFeedbackService,
} from './createPublicFeedbackService';
export type { FeedbackServiceConfig, PublicFeedbackServiceConfig } from './types';

// Avatar
export { generateAvatarSvg } from './avatar';

// UI Components
export { default as ReactionBar } from './ReactionBar.svelte';
export { default as EulenAvatar } from './EulenAvatar.svelte';
