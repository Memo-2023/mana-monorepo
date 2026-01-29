import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { MetricsService } from '../metrics/metrics.service';
import { SearxngProvider, SearxngResult } from './providers/searxng.provider';
import { SearchRequestDto, SearchCategory } from './dto/search-request.dto';
import { SearchResponse, SearchResult } from './dto/search-response.dto';

@Injectable()
export class SearchService {
	private readonly logger = new Logger(SearchService.name);

	constructor(
		private readonly configService: ConfigService,
		private readonly cacheService: CacheService,
		private readonly metricsService: MetricsService,
		private readonly searxngProvider: SearxngProvider,
	) {}

	async search(request: SearchRequestDto): Promise<SearchResponse> {
		const startTime = Date.now();
		this.metricsService.incrementActiveSearches();

		try {
			// 1. Build cache key
			const cacheKey = this.buildCacheKey(request);

			// 2. Check cache
			if (request.cache?.enabled !== false) {
				const cached = await this.cacheService.get<SearchResponse>(cacheKey);
				if (cached) {
					this.logger.debug(`Cache hit for: ${request.query}`);
					return {
						...cached,
						meta: { ...cached.meta, cached: true },
					};
				}
			}

			// 3. Query SearXNG
			const results = await this.searxngProvider.search({
				q: request.query,
				categories: request.options?.categories?.join(','),
				engines: request.options?.engines?.join(','),
				language:
					request.options?.language ||
					this.configService.get('searxng.defaultLanguage', 'de-DE'),
				time_range: request.options?.timeRange,
				safesearch: request.options?.safeSearch ?? 0,
				format: 'json',
			});

			// 4. Normalize and rank results
			const normalizedResults = this.normalizeResults(
				results,
				request.options?.limit || 10,
			);

			// 5. Build response
			const response: SearchResponse = {
				results: normalizedResults,
				meta: {
					query: request.query,
					totalResults: normalizedResults.length,
					engines: [...new Set(normalizedResults.map((r) => r.engine))],
					duration: Date.now() - startTime,
					cached: false,
					cacheKey,
				},
			};

			// 6. Cache result
			if (request.cache?.enabled !== false) {
				const ttl =
					request.cache?.ttl ||
					this.configService.get<number>('cache.searchTtl', 3600);
				await this.cacheService.set(cacheKey, response, ttl);
			}

			this.metricsService.recordRequest('search', 200, Date.now() - startTime);
			return response;
		} finally {
			this.metricsService.decrementActiveSearches();
		}
	}

	private buildCacheKey(request: SearchRequestDto): string {
		const parts = [
			'search',
			request.query.toLowerCase().trim(),
			request.options?.categories?.sort().join('-') || 'all',
			request.options?.engines?.sort().join('-') || 'all',
			request.options?.language || 'default',
			request.options?.timeRange || 'any',
			String(request.options?.safeSearch ?? 0),
		];
		return parts.join(':');
	}

	private normalizeResults(rawResults: SearxngResult[], limit: number): SearchResult[] {
		// Deduplicate by URL
		const seen = new Set<string>();
		const deduped = rawResults.filter((r) => {
			const normalizedUrl = r.url.toLowerCase().replace(/\/$/, '');
			if (seen.has(normalizedUrl)) return false;
			seen.add(normalizedUrl);
			return true;
		});

		return deduped
			.map((r) => ({
				url: r.url,
				title: r.title || 'Untitled',
				snippet: r.content || '',
				engine: r.engine,
				score: this.calculateScore(r),
				publishedDate: r.publishedDate,
				thumbnail: r.thumbnail,
				category: r.category || 'general',
			}))
			.sort((a, b) => b.score - a.score)
			.slice(0, Math.min(limit, 50));
	}

	private calculateScore(result: SearxngResult): number {
		// Base score from SearXNG
		let score = result.score || 0.5;

		// Boost for having content
		if (result.content && result.content.length > 100) {
			score += 0.1;
		}

		// Boost for trusted domains
		const trustedDomains = ['wikipedia.org', 'github.com', 'stackoverflow.com'];
		if (trustedDomains.some((d) => result.url.includes(d))) {
			score += 0.15;
		}

		// Slight penalty for very long URLs (often less useful)
		if (result.url.length > 200) {
			score -= 0.05;
		}

		return Math.min(1, Math.max(0, score));
	}

	async getEngines(): Promise<string[]> {
		return this.searxngProvider.getEngines();
	}

	async healthCheck(): Promise<{ status: string; latency: number }> {
		return this.searxngProvider.healthCheck();
	}
}
