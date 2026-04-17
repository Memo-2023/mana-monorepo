/**
 * HTTP client for mana-search (Go service on port 3021).
 * Used by the SearXNGProvider and ReadabilityProvider wrappers.
 */

import { ProviderError } from '../lib/errors';

export interface ManaSearchHit {
	url: string;
	title: string;
	snippet: string;
	engine?: string;
	score?: number;
	publishedDate?: string;
	category?: string;
}

export interface ManaSearchResponse {
	results: ManaSearchHit[];
	meta: {
		query: string;
		totalResults: number;
		engines: string[];
		cached: boolean;
		duration: number;
	};
}

export interface ManaExtractResponse {
	success: boolean;
	content?: {
		title: string;
		text: string;
		markdown?: string;
		author?: string;
		publishedDate?: string;
		siteName?: string;
		wordCount: number;
	};
}

export class ManaSearchClient {
	constructor(private baseUrl: string) {}

	async search(
		query: string,
		options: {
			limit?: number;
			categories?: string[];
			language?: string;
			signal?: AbortSignal;
		} = {}
	): Promise<ManaSearchResponse> {
		const res = await fetch(`${this.baseUrl}/api/v1/search`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query,
				options: {
					limit: options.limit ?? 10,
					categories: options.categories,
					language: options.language ?? 'de-DE',
				},
			}),
			signal: options.signal,
		});
		if (!res.ok) {
			throw new ProviderError('searxng', `mana-search returned ${res.status}`);
		}
		return res.json() as Promise<ManaSearchResponse>;
	}

	async extract(
		url: string,
		options: { maxLength?: number; signal?: AbortSignal } = {}
	): Promise<ManaExtractResponse> {
		const res = await fetch(`${this.baseUrl}/api/v1/extract`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				url,
				options: { maxLength: options.maxLength ?? 50000, includeMarkdown: true },
			}),
			signal: options.signal,
		});
		if (!res.ok) {
			throw new ProviderError('readability', `mana-search extract returned ${res.status}`);
		}
		return res.json() as Promise<ManaExtractResponse>;
	}
}
