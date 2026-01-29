import { Controller, Post, Get, Body, Delete, Logger } from '@nestjs/common';
import { SearchService } from './search.service';
import { CacheService } from '../cache/cache.service';
import { SearchRequestDto } from './dto/search-request.dto';
import { SearchResponse } from './dto/search-response.dto';

@Controller('search')
export class SearchController {
	private readonly logger = new Logger(SearchController.name);

	constructor(
		private readonly searchService: SearchService,
		private readonly cacheService: CacheService,
	) {}

	/**
	 * Perform a web search
	 * POST /api/v1/search
	 */
	@Post()
	async search(@Body() request: SearchRequestDto): Promise<SearchResponse> {
		this.logger.log(`Search request: "${request.query}"`);
		return this.searchService.search(request);
	}

	/**
	 * Get available search engines
	 * GET /api/v1/search/engines
	 */
	@Get('engines')
	async getEngines(): Promise<{ engines: string[] }> {
		const engines = await this.searchService.getEngines();
		return { engines };
	}

	/**
	 * Get search service health
	 * GET /api/v1/search/health
	 */
	@Get('health')
	async health() {
		const searxng = await this.searchService.healthCheck();
		const cache = await this.cacheService.healthCheck();
		const cacheStats = this.cacheService.getStats();

		return {
			searxng,
			cache: {
				...cache,
				stats: cacheStats,
			},
		};
	}

	/**
	 * Clear search cache
	 * DELETE /api/v1/search/cache
	 */
	@Delete('cache')
	async clearCache(): Promise<{ cleared: boolean; keysRemoved: number }> {
		const keysRemoved = await this.cacheService.clear();
		return { cleared: true, keysRemoved };
	}
}
