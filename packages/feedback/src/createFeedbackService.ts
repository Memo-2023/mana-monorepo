/**
 * Feedback Service Factory — Public-Community Hub client.
 *
 * One factory builds the auth-required service used by logged-in users
 * (submit, react, manage own items). The companion `createPublicFeedbackService`
 * (in createPublicFeedbackService.ts) is for SSR / unauthenticated reads.
 */

import type {
	CreateFeedbackInput,
	FeedbackQueryParams,
	FeedbackResponse,
	FeedbackListResponse,
	PublicFeedListResponse,
	PublicItemResponse,
	ReactionResponse,
	AdminPatchInput,
	ReactInput,
} from './api';
import type { FeedbackServiceConfig } from './types';
import type { PublicFeedbackItem, ReactionEmoji } from './feedback';

export function createFeedbackService(config: FeedbackServiceConfig) {
	const {
		apiUrl,
		appId,
		getAuthToken,
		feedbackEndpoint = '/api/v1/feedback',
		publicEndpoint = '/api/v1/public/feedback',
	} = config;

	const baseUrl = apiUrl.replace(/\/$/, '');

	async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const token = await getAuthToken();
		if (!token) throw new Error('Not authenticated');

		const response = await fetch(`${baseUrl}${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
				'X-App-Id': appId,
				...options.headers,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async function fetchPublic<T>(endpoint: string): Promise<T> {
		const response = await fetch(`${baseUrl}${endpoint}`);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		return response.json();
	}

	function feedQueryString(query?: FeedbackQueryParams): string {
		const params = new URLSearchParams();
		params.set('appId', query?.appId ?? appId);
		if (query?.moduleContext) params.set('moduleContext', query.moduleContext);
		if (query?.status) params.set('status', query.status);
		if (query?.category) params.set('category', query.category);
		if (query?.sort) params.set('sort', query.sort);
		if (query?.limit) params.set('limit', String(query.limit));
		if (query?.offset) params.set('offset', String(query.offset));
		return params.toString();
	}

	// ── Submission ──────────────────────────────────────────────────

	async function createFeedback(input: CreateFeedbackInput): Promise<FeedbackResponse> {
		return fetchWithAuth<FeedbackResponse>(feedbackEndpoint, {
			method: 'POST',
			body: JSON.stringify(input),
		});
	}

	// ── Reads (auth-required) ──────────────────────────────────────

	/** Auth-enriched public feed: each item carries `myReactions[]`. */
	async function getPublicFeed(query?: FeedbackQueryParams): Promise<PublicFeedbackItem[]> {
		const qs = feedQueryString(query);
		const res = await fetchWithAuth<PublicFeedListResponse>(`${feedbackEndpoint}/public?${qs}`);
		return res.items;
	}

	async function getMyFeedback(): Promise<FeedbackListResponse> {
		return fetchWithAuth<FeedbackListResponse>(`${feedbackEndpoint}/me`);
	}

	async function getReplies(feedbackId: string): Promise<PublicFeedbackItem[]> {
		return fetchWithAuth<PublicFeedbackItem[]>(`${feedbackEndpoint}/${feedbackId}/replies`);
	}

	// ── Reads (anonymous, no auth) ─────────────────────────────────

	async function getPublicFeedAnonymous(
		query?: FeedbackQueryParams
	): Promise<PublicFeedbackItem[]> {
		const qs = feedQueryString(query);
		const res = await fetchPublic<PublicFeedListResponse>(`${publicEndpoint}/feed?${qs}`);
		return res.items;
	}

	async function getPublicItemAnonymous(id: string): Promise<PublicItemResponse> {
		return fetchPublic<PublicItemResponse>(`${publicEndpoint}/${id}`);
	}

	// ── Reactions ──────────────────────────────────────────────────

	async function toggleReaction(
		feedbackId: string,
		emoji: ReactionEmoji
	): Promise<ReactionResponse> {
		return fetchWithAuth<ReactionResponse>(`${feedbackEndpoint}/${feedbackId}/react`, {
			method: 'POST',
			body: JSON.stringify({ emoji } satisfies ReactInput),
		});
	}

	// ── Mutations ──────────────────────────────────────────────────

	async function deleteFeedback(feedbackId: string): Promise<{ success: boolean }> {
		return fetchWithAuth<{ success: boolean }>(`${feedbackEndpoint}/${feedbackId}`, {
			method: 'DELETE',
		});
	}

	// ── Admin ──────────────────────────────────────────────────────

	async function adminListAll(query?: FeedbackQueryParams): Promise<FeedbackListResponse> {
		const qs = feedQueryString(query);
		return fetchWithAuth<FeedbackListResponse>(`${feedbackEndpoint}/admin?${qs}`);
	}

	async function adminPatch(feedbackId: string, patch: AdminPatchInput): Promise<FeedbackResponse> {
		return fetchWithAuth<FeedbackResponse>(`${feedbackEndpoint}/admin/${feedbackId}`, {
			method: 'PATCH',
			body: JSON.stringify(patch),
		});
	}

	return {
		createFeedback,
		getPublicFeed,
		getPublicFeedAnonymous,
		getPublicItemAnonymous,
		getMyFeedback,
		getReplies,
		toggleReaction,
		deleteFeedback,
		adminListAll,
		adminPatch,
	};
}

export type FeedbackService = ReturnType<typeof createFeedbackService>;
