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
	/**
	 * Server-side quality flag. Today only `'probable_consent_wall'` is
	 * emitted: the extracted text was suspiciously short AND contained
	 * consent-dialog vocabulary, which typically means the server's
	 * anonymous fetch hit a GDPR interstitial instead of the article.
	 * The client uses this to offer the bookmarklet-v2 (browser-HTML)
	 * path without silently persisting garbage.
	 */
	warning?: 'probable_consent_wall';
}

/**
 * Hard client-side timeout for the extract roundtrip. The server's
 * own Readability fetch has a 15s timeout + a few seconds of JSDOM
 * parse overhead; anything past 25s on the wire is almost certainly a
 * dead server or a stuck network path, not a slow article. Without
 * this, AddUrlForm's loader just sat there forever when the API was
 * unreachable — hence the bookmarklet-lands-on-loader bug.
 */
const EXTRACT_TIMEOUT_MS = 25_000;

export async function extractArticle(
	url: string,
	fetchImpl: typeof fetch = fetch
): Promise<ExtractedArticle> {
	let response: Response;
	try {
		response = await fetchImpl(`${getManaApiUrl()}/api/v1/articles/extract`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(await authHeader()),
			},
			body: JSON.stringify({ url }),
			signal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS),
		});
	} catch (err) {
		if (err instanceof DOMException && err.name === 'TimeoutError') {
			throw new Error(
				`Server antwortet nicht (nach ${EXTRACT_TIMEOUT_MS / 1000}s). Läuft apps/api?`
			);
		}
		if (err instanceof TypeError) {
			// Network-layer failure (connection refused, DNS, offline).
			throw new Error(
				`Server nicht erreichbar. Prüf dass apps/api läuft — pnpm run mana:dev startet beides.`
			);
		}
		throw err;
	}
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`extractArticle failed: ${response.status} ${text}`);
	}
	return (await response.json()) as ExtractedArticle;
}

/**
 * Extract from a HTML payload the browser already has. Used by the
 * bookmarklet-v2 flow — the user's browser already dealt with the
 * cookie-consent wall, so we skip the server-side fetch entirely.
 *
 * The HTML cap is 10 MiB on the server; the browser sends
 * `document.documentElement.outerHTML` which for typical article
 * pages is 200-800 KB, well under the limit.
 */
export async function extractFromHtml(
	url: string,
	html: string,
	fetchImpl: typeof fetch = fetch
): Promise<ExtractedArticle> {
	let response: Response;
	try {
		response = await fetchImpl(`${getManaApiUrl()}/api/v1/articles/extract/html`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(await authHeader()),
			},
			body: JSON.stringify({ url, html }),
			signal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS),
		});
	} catch (err) {
		if (err instanceof DOMException && err.name === 'TimeoutError') {
			throw new Error(
				`Server antwortet nicht (nach ${EXTRACT_TIMEOUT_MS / 1000}s). Läuft apps/api?`
			);
		}
		if (err instanceof TypeError) {
			throw new Error(
				`Server nicht erreichbar. Prüf dass apps/api läuft — pnpm run mana:dev startet beides.`
			);
		}
		throw err;
	}
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`extractFromHtml failed: ${response.status} ${text}`);
	}
	return (await response.json()) as ExtractedArticle;
}
