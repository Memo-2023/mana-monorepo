/**
 * Articles API client — talks to apps/api `/api/v1/articles/*`.
 *
 * One endpoint (`POST /extract`) with the Readability result. Both the
 * preview (AddUrlForm) and the direct save paths share the same call;
 * the client chooses whether to show the result or immediately persist.
 *
 * Auth + base-URL handling mirrors news/api.ts — see that file for the
 * full rationale on why we read `getManaApiUrl()` and `authStore.
 * getValidToken()` instead of the cookie/env shortcuts.
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaApiUrl } from '$lib/api/config';

async function authHeader(): Promise<Record<string, string>> {
	const token = await authStore.getValidToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ExtractedArticle {
	originalUrl: string;
	title: string;
	excerpt: string | null;
	content: string;
	htmlContent: string;
	author: string | null;
	siteName: string | null;
	wordCount: number;
	readingTimeMinutes: number;
}

export async function extractArticle(
	url: string,
	fetchImpl: typeof fetch = fetch
): Promise<ExtractedArticle> {
	const response = await fetchImpl(`${getManaApiUrl()}/api/v1/articles/extract`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(await authHeader()),
		},
		body: JSON.stringify({ url }),
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`extractArticle failed: ${response.status} ${text}`);
	}
	return (await response.json()) as ExtractedArticle;
}
