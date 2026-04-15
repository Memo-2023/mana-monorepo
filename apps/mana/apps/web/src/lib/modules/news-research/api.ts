/**
 * News Research API client — talks to apps/api `/api/v1/news-research/*`.
 * Mirrors the auth-header pattern of `news/api.ts`.
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaApiUrl } from '$lib/api/config';
import type {
	DiscoveredFeedDto,
	FeedValidationDto,
	ScoredArticleDto,
	ExtractedArticleDto,
} from './types';

async function authHeader(): Promise<Record<string, string>> {
	const token = await authStore.getValidToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

async function post<T>(path: string, body: unknown, fetchImpl: typeof fetch = fetch): Promise<T> {
	const res = await fetchImpl(`${getManaApiUrl()}/api/v1/news-research${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		let message = text;
		try {
			const parsed = JSON.parse(text) as { message?: string; error?: string };
			message = parsed.message ?? parsed.error ?? text;
		} catch {
			// text was not JSON — keep raw
		}
		throw new Error(message || `news-research ${path} failed (${res.status})`);
	}
	return (await res.json()) as T;
}

export function discoverBySite(siteUrl: string, fetchImpl?: typeof fetch) {
	return post<{ feeds: DiscoveredFeedDto[] }>('/discover', { siteUrl }, fetchImpl);
}

export function discoverByQuery(query: string, language?: string, fetchImpl?: typeof fetch) {
	return post<{ feeds: DiscoveredFeedDto[]; searched: number }>(
		'/discover',
		{ query, language },
		fetchImpl
	);
}

export function validateFeedUrl(url: string, fetchImpl?: typeof fetch) {
	return post<FeedValidationDto>('/validate', { url }, fetchImpl);
}

export function searchFeeds(
	feeds: string[],
	query: string,
	options: { limit?: number; sinceIso?: string } = {},
	fetchImpl?: typeof fetch
) {
	return post<{ articles: ScoredArticleDto[]; feedCount: number }>(
		'/search',
		{ feeds, query, ...options },
		fetchImpl
	);
}

export function extractArticle(url: string, fetchImpl?: typeof fetch) {
	return post<ExtractedArticleDto>('/extract', { url }, fetchImpl);
}
