import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SearxngQuery {
	q: string;
	categories?: string;
	engines?: string;
	language?: string;
	time_range?: string;
	safesearch?: number;
	format: 'json';
}

export interface SearxngResult {
	url: string;
	title: string;
	content?: string;
	engine: string;
	score?: number;
	category?: string;
	publishedDate?: string;
	thumbnail?: string;
	parsed_url?: string[];
	engines?: string[];
	positions?: number[];
}

interface SearxngResponse {
	query: string;
	results: SearxngResult[];
	suggestions: string[];
	infoboxes: unknown[];
	number_of_results: number;
}

@Injectable()
export class SearxngProvider {
	private readonly logger = new Logger(SearxngProvider.name);
	private readonly baseUrl: string;
	private readonly timeout: number;

	constructor(private readonly configService: ConfigService) {
		this.baseUrl = this.configService.get<string>('searxng.url', 'http://searxng:8080');
		this.timeout = this.configService.get<number>('searxng.timeout', 15000);
	}

	async search(query: SearxngQuery): Promise<SearxngResult[]> {
		const url = new URL('/search', this.baseUrl);

		// Query-Parameter setzen
		Object.entries(query).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				url.searchParams.set(key, String(value));
			}
		});

		this.logger.debug(`SearXNG request: ${url.toString()}`);

		try {
			const response = await fetch(url.toString(), {
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				const text = await response.text();
				this.logger.error(`SearXNG error ${response.status}: ${text}`);
				throw new HttpException(
					`Search engine error: ${response.status}`,
					HttpStatus.BAD_GATEWAY,
				);
			}

			const data: SearxngResponse = await response.json();

			this.logger.debug(
				`SearXNG returned ${data.results.length} results for "${query.q}"`,
			);

			return data.results;
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}

			if (error instanceof Error && error.name === 'TimeoutError') {
				this.logger.error(`SearXNG timeout for query: ${query.q}`);
				throw new HttpException('Search timeout', HttpStatus.GATEWAY_TIMEOUT);
			}

			this.logger.error(`SearXNG search failed: ${error}`);
			throw new HttpException(
				'Search service unavailable',
				HttpStatus.SERVICE_UNAVAILABLE,
			);
		}
	}

	async healthCheck(): Promise<{ status: string; latency: number }> {
		const start = Date.now();
		try {
			const response = await fetch(`${this.baseUrl}/healthz`, {
				signal: AbortSignal.timeout(5000),
			});
			return {
				status: response.ok ? 'ok' : 'error',
				latency: Date.now() - start,
			};
		} catch {
			return { status: 'error', latency: Date.now() - start };
		}
	}

	async getEngines(): Promise<string[]> {
		try {
			const response = await fetch(`${this.baseUrl}/config`, {
				signal: AbortSignal.timeout(5000),
			});

			if (!response.ok) {
				return [];
			}

			const config = await response.json();
			return Object.keys(config.engines || {});
		} catch {
			return [];
		}
	}
}
