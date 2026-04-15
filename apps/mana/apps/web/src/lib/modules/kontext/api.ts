/**
 * Kontext API client — talks to apps/api `POST /api/v1/context/import-url`.
 *
 * The server route lives under /context for historical reasons (shared
 * crawler + LLM wrapper). Only the kontext singleton consumes it.
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaApiUrl } from '$lib/api/config';

export type CrawlMode = 'single' | 'deep';

export interface ImportInput {
	url: string;
	mode: CrawlMode;
	summarize: boolean;
}

export interface ImportResponse {
	title: string;
	content: string;
	sourceUrl: string;
	crawlMode: CrawlMode;
	crawledAt: string;
	pageCount: number;
}

export async function crawlUrlViaApi(input: ImportInput): Promise<ImportResponse> {
	const token = await authStore.getValidToken();
	if (!token) throw new Error('not authenticated');
	const res = await fetch(`${getManaApiUrl()}/api/v1/context/import-url`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(input),
	});
	if (!res.ok) {
		const body = (await res.json().catch(() => ({}))) as { error?: string };
		throw new Error(body.error || `import failed (${res.status})`);
	}
	return (await res.json()) as ImportResponse;
}
