/**
 * Public, anonymous feedback service — for SSR / unauthenticated reads
 * of the community feed (e.g. /community route, embeddable widget).
 *
 * No auth, no submit, no react. If you need write access, instantiate
 * `createFeedbackService()` instead and pass a getAuthToken callback.
 */

import type {
	PublicFeedListResponse,
	PublicItemResponse,
	EulenProfileResponse,
	FeedbackQueryParams,
} from './api';
import type { PublicFeedbackItem } from './feedback';
import type { PublicFeedbackServiceConfig } from './types';

export function createPublicFeedbackService(config: PublicFeedbackServiceConfig) {
	const { apiUrl, appId, publicEndpoint = '/api/v1/public/feedback' } = config;
	const baseUrl = apiUrl.replace(/\/$/, '');

	async function fetchPublic<T>(endpoint: string): Promise<T> {
		const res = await fetch(`${baseUrl}${endpoint}`);
		if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		return res.json();
	}

	function feedQueryString(query?: FeedbackQueryParams): string {
		const params = new URLSearchParams();
		const effectiveAppId = query?.appId ?? appId;
		if (effectiveAppId) params.set('appId', effectiveAppId);
		if (query?.moduleContext) params.set('moduleContext', query.moduleContext);
		if (query?.status) params.set('status', query.status);
		if (query?.category) params.set('category', query.category);
		if (query?.limit) params.set('limit', String(query.limit));
		if (query?.offset) params.set('offset', String(query.offset));
		return params.toString();
	}

	async function getFeed(query?: FeedbackQueryParams): Promise<PublicFeedbackItem[]> {
		const qs = feedQueryString(query);
		const res = await fetchPublic<PublicFeedListResponse>(`${publicEndpoint}/feed?${qs}`);
		return res.items;
	}

	async function getItem(id: string): Promise<PublicItemResponse> {
		return fetchPublic<PublicItemResponse>(`${publicEndpoint}/${id}`);
	}

	async function getEulenProfile(displayHash: string): Promise<EulenProfileResponse> {
		return fetchPublic<EulenProfileResponse>(`${publicEndpoint}/eule/${displayHash}`);
	}

	return { getFeed, getItem, getEulenProfile };
}

export type PublicFeedbackService = ReturnType<typeof createPublicFeedbackService>;
