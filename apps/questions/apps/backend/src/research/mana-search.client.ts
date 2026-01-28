import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SearchOptions {
	categories?: string[];
	engines?: string[];
	language?: string;
	limit?: number;
}

export interface SearchResult {
	url: string;
	title: string;
	snippet?: string;
	engine: string;
	score?: number;
	publishedDate?: string;
	thumbnail?: string;
}

export interface SearchResponse {
	results: SearchResult[];
	meta: {
		query: string;
		duration: number;
		total: number;
		cached: boolean;
	};
}

export interface ExtractOptions {
	includeMarkdown?: boolean;
	includeHtml?: boolean;
	maxLength?: number;
	timeout?: number;
}

export interface ExtractedContent {
	title: string;
	description?: string;
	author?: string;
	publishedDate?: string;
	siteName?: string;
	text: string;
	markdown?: string;
	html?: string;
	wordCount: number;
	readingTime: number;
	ogImage?: string;
}

export interface ExtractResponse {
	success: boolean;
	content?: ExtractedContent;
	error?: string;
	meta: {
		url: string;
		duration: number;
		cached: boolean;
	};
}

export interface BulkExtractResponse {
	results: Array<{
		url: string;
		success: boolean;
		content?: ExtractedContent;
		error?: string;
	}>;
	meta: {
		total: number;
		successful: number;
		failed: number;
		duration: number;
	};
}

@Injectable()
export class ManaSearchClient {
	private readonly logger = new Logger(ManaSearchClient.name);
	private readonly baseUrl: string;
	private readonly timeout: number;

	constructor(private readonly configService: ConfigService) {
		this.baseUrl = this.configService.get<string>('manaSearch.url', 'http://localhost:3021');
		this.timeout = this.configService.get<number>('manaSearch.timeout', 30000);
	}

	async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
		const url = `${this.baseUrl}/api/v1/search`;

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					query,
					options: {
						categories: options?.categories || ['general'],
						engines: options?.engines,
						language: options?.language || 'de-DE',
						limit: options?.limit || 20,
					},
				}),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				throw new Error(`Search failed: ${response.status} ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			this.logger.error(`Search error for "${query}": ${error}`);
			throw error;
		}
	}

	async extract(url: string, options?: ExtractOptions): Promise<ExtractResponse> {
		const apiUrl = `${this.baseUrl}/api/v1/extract`;

		try {
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					url,
					options: {
						includeMarkdown: options?.includeMarkdown ?? true,
						includeHtml: options?.includeHtml ?? false,
						maxLength: options?.maxLength || 50000,
						timeout: options?.timeout || 10000,
					},
				}),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				throw new Error(`Extract failed: ${response.status} ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			this.logger.error(`Extract error for "${url}": ${error}`);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Extraction failed',
				meta: {
					url,
					duration: 0,
					cached: false,
				},
			};
		}
	}

	async bulkExtract(urls: string[], options?: ExtractOptions): Promise<BulkExtractResponse> {
		const apiUrl = `${this.baseUrl}/api/v1/extract/bulk`;

		try {
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					urls,
					options: {
						includeMarkdown: options?.includeMarkdown ?? true,
						includeHtml: options?.includeHtml ?? false,
						maxLength: options?.maxLength || 50000,
					},
					concurrency: 5,
				}),
				signal: AbortSignal.timeout(this.timeout * urls.length),
			});

			if (!response.ok) {
				throw new Error(`Bulk extract failed: ${response.status} ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			this.logger.error(`Bulk extract error: ${error}`);
			throw error;
		}
	}

	async healthCheck(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/health`, {
				signal: AbortSignal.timeout(5000),
			});
			return response.ok;
		} catch {
			return false;
		}
	}
}
