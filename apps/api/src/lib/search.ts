/**
 * Thin client for the mana-search Go service.
 *
 * Two helpers, scoped to what the research orchestrator needs:
 *
 *   webSearch()    — POST /api/v1/search, returns ranked SearXNG results.
 *   bulkExtract()  — POST /api/v1/extract/bulk, returns Readability text per URL.
 *
 * Internal service-to-service calls — no auth on the wire (private network).
 */

const SEARCH_URL = process.env.MANA_SEARCH_URL || 'http://localhost:3021';

export interface SearchHit {
	url: string;
	title: string;
	snippet: string;
	engine: string;
	score: number;
	publishedDate?: string;
	category: string;
}

export interface ExtractedContent {
	title: string;
	description?: string;
	author?: string;
	publishedDate?: string;
	siteName?: string;
	text: string;
	wordCount: number;
}

export interface BulkExtractResult {
	url: string;
	success: boolean;
	content?: ExtractedContent;
	error?: string;
}

export class SearchError extends Error {
	constructor(
		message: string,
		public readonly status?: number
	) {
		super(message);
		this.name = 'SearchError';
	}
}

export interface WebSearchOptions {
	query: string;
	limit?: number;
	categories?: string[]; // 'general' | 'news' | 'science' | 'it'
	language?: string;
	signal?: AbortSignal;
}

/** Run one SearXNG query via mana-search and return normalised hits. */
export async function webSearch(opts: WebSearchOptions): Promise<SearchHit[]> {
	const res = await fetch(`${SEARCH_URL}/api/v1/search`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			query: opts.query,
			options: {
				limit: opts.limit ?? 10,
				categories: opts.categories,
				language: opts.language ?? 'de-DE',
			},
		}),
		signal: opts.signal,
	});

	if (!res.ok) {
		throw new SearchError(`mana-search returned ${res.status}`, res.status);
	}

	const data = (await res.json()) as { results?: SearchHit[] };
	return data.results ?? [];
}

/**
 * Extract Readability content for a batch of URLs in parallel server-side.
 * mana-search caps at 20 URLs per call; we slice if more come in.
 */
export async function bulkExtract(
	urls: string[],
	opts: { maxLength?: number; concurrency?: number; signal?: AbortSignal } = {}
): Promise<BulkExtractResult[]> {
	if (urls.length === 0) return [];

	const batches: string[][] = [];
	for (let i = 0; i < urls.length; i += 20) batches.push(urls.slice(i, i + 20));

	const all: BulkExtractResult[] = [];
	for (const batch of batches) {
		const res = await fetch(`${SEARCH_URL}/api/v1/extract/bulk`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				urls: batch,
				concurrency: opts.concurrency ?? 5,
				options: {
					maxLength: opts.maxLength ?? 8000,
				},
			}),
			signal: opts.signal,
		});

		if (!res.ok) {
			throw new SearchError(`mana-search bulk extract returned ${res.status}`, res.status);
		}

		const data = (await res.json()) as { results?: BulkExtractResult[] };
		if (data.results) all.push(...data.results);
	}

	return all;
}
