/**
 * News API client — talks to apps/api `/api/v1/news/*`.
 *
 * Two flavors of endpoints:
 *   - GET /feed         — pulls the curated pool, with topic/lang filters
 *   - POST /extract/*   — Mozilla Readability for ad-hoc URL saves
 *
 * The base URL comes from `getManaApiUrl()`, which on the client reads the
 * browser-injected `__PUBLIC_MANA_API_URL__` (set from
 * `PUBLIC_MANA_API_URL_CLIENT` in hooks.server.ts → e.g.
 * `https://mana-api.mana.how`) and on the server reads `process.env`
 * directly. Reading `$env/dynamic/public.PUBLIC_MANA_API_URL` here would
 * leak the SSR-side internal Docker hostname (`http://mana-api:3060`) to
 * the browser and trip CSP / DNS.
 *
 * Auth is the unified Mana JWT, picked up by the same fetch wrapper the
 * rest of the app uses (cookie + Authorization header set by SvelteKit
 * `fetch` via the auth-provider middleware).
 */

import { getManaApiUrl } from '$lib/api/config';

export interface FeedArticleDto {
	id: string;
	originalUrl: string;
	title: string;
	excerpt: string | null;
	content: string;
	htmlContent: string | null;
	author: string | null;
	siteName: string;
	sourceSlug: string;
	imageUrl: string | null;
	topic: string;
	language: string;
	wordCount: number | null;
	readingTimeMinutes: number | null;
	publishedAt: string | null;
	ingestedAt: string;
}

export interface FeedQuery {
	topics?: string[];
	lang?: 'de' | 'en' | 'all';
	since?: string;
	limit?: number;
	offset?: number;
}

export async function fetchFeed(
	query: FeedQuery = {},
	fetchImpl: typeof fetch = fetch
): Promise<FeedArticleDto[]> {
	const params = new URLSearchParams();
	if (query.topics && query.topics.length > 0) {
		params.set('topics', query.topics.join(','));
	}
	if (query.lang && query.lang !== 'all') params.set('lang', query.lang);
	if (query.since) params.set('since', query.since);
	if (query.limit != null) params.set('limit', String(query.limit));
	if (query.offset != null) params.set('offset', String(query.offset));

	const url = `${getManaApiUrl()}/api/v1/news/feed${params.toString() ? `?${params}` : ''}`;
	const response = await fetchImpl(url, { credentials: 'include' });
	if (!response.ok) {
		throw new Error(`fetchFeed failed: ${response.status}`);
	}
	return (await response.json()) as FeedArticleDto[];
}

// ─── Ad-hoc URL extraction ─────────────────────────────────

export interface ExtractedArticleDto {
	id: string;
	type: 'saved';
	sourceOrigin: 'user_saved';
	originalUrl: string;
	title: string;
	content: string;
	htmlContent: string;
	excerpt: string;
	author: string | null;
	siteName: string | null;
	wordCount: number;
	readingTimeMinutes: number;
	isArchived: boolean;
}

export async function extractFromUrl(
	url: string,
	fetchImpl: typeof fetch = fetch
): Promise<ExtractedArticleDto> {
	const response = await fetchImpl(`${getManaApiUrl()}/api/v1/news/extract/save`, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url }),
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`extractFromUrl failed: ${response.status} ${text}`);
	}
	return (await response.json()) as ExtractedArticleDto;
}
