/**
 * Feedback Service Factory
 *
 * Creates a feedback service instance configured for a specific app.
 * Handles feedback submission, retrieval, and voting.
 *
 * @example
 * ```ts
 * import { createFeedbackService } from '@manacore/shared-feedback-service';
 * import { authStore } from '$lib/stores/auth.svelte';
 *
 * export const feedbackService = createFeedbackService({
 *   apiUrl: 'https://auth.manacore.app',
 *   appId: 'chat',
 *   getAuthToken: async () => authStore.getToken(),
 * });
 * ```
 */

import type {
	CreateFeedbackInput,
	FeedbackQueryParams,
	FeedbackResponse,
	FeedbackListResponse,
	VoteResponse,
} from '@manacore/shared-feedback-types';
import type { FeedbackServiceConfig } from './types';

/**
 * Create a feedback service instance
 */
export function createFeedbackService(config: FeedbackServiceConfig) {
	const { apiUrl, appId, getAuthToken, feedbackEndpoint = '/api/v1/feedback' } = config;

	// Normalize API URL (remove trailing slash)
	const baseUrl = apiUrl.replace(/\/$/, '');

	/**
	 * Helper to make authenticated requests
	 */
	async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const token = await getAuthToken();

		if (!token) {
			throw new Error('Not authenticated');
		}

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

	/**
	 * Submit new feedback
	 */
	async function createFeedback(input: CreateFeedbackInput): Promise<FeedbackResponse> {
		return fetchWithAuth<FeedbackResponse>(feedbackEndpoint, {
			method: 'POST',
			body: JSON.stringify(input),
		});
	}

	/**
	 * Get public community feedback
	 */
	async function getPublicFeedback(query?: FeedbackQueryParams): Promise<FeedbackListResponse> {
		const params = new URLSearchParams();

		// Always filter by current app
		params.set('appId', appId);

		if (query?.status) params.set('status', query.status);
		if (query?.category) params.set('category', query.category);
		if (query?.sort) params.set('sort', query.sort);
		if (query?.limit) params.set('limit', String(query.limit));
		if (query?.offset) params.set('offset', String(query.offset));

		return fetchWithAuth<FeedbackListResponse>(`${feedbackEndpoint}/public?${params}`);
	}

	/**
	 * Get user's own feedback
	 */
	async function getMyFeedback(): Promise<FeedbackListResponse> {
		const params = new URLSearchParams();
		params.set('appId', appId);

		return fetchWithAuth<FeedbackListResponse>(`${feedbackEndpoint}/my?${params}`);
	}

	/**
	 * Vote on a feedback item
	 */
	async function vote(feedbackId: string): Promise<VoteResponse> {
		return fetchWithAuth<VoteResponse>(`${feedbackEndpoint}/${feedbackId}/vote`, {
			method: 'POST',
		});
	}

	/**
	 * Remove vote from a feedback item
	 */
	async function unvote(feedbackId: string): Promise<VoteResponse> {
		return fetchWithAuth<VoteResponse>(`${feedbackEndpoint}/${feedbackId}/vote`, {
			method: 'DELETE',
		});
	}

	/**
	 * Toggle vote on a feedback item
	 */
	async function toggleVote(feedbackId: string, currentlyVoted: boolean): Promise<VoteResponse> {
		if (currentlyVoted) {
			return unvote(feedbackId);
		} else {
			return vote(feedbackId);
		}
	}

	return {
		createFeedback,
		getPublicFeedback,
		getMyFeedback,
		vote,
		unvote,
		toggleVote,
	};
}

/**
 * Type for the feedback service instance
 */
export type FeedbackService = ReturnType<typeof createFeedbackService>;
