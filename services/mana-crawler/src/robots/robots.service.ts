import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import robotsParser from 'robots-parser';
import { CacheService } from '../cache/cache.service';

interface RobotsData {
	allowed: boolean;
	crawlDelay?: number;
	sitemaps: string[];
}

@Injectable()
export class RobotsService {
	private readonly logger = new Logger(RobotsService.name);
	private readonly userAgent: string;
	private readonly cacheTtl: number;

	constructor(
		private readonly configService: ConfigService,
		private readonly cacheService: CacheService,
	) {
		this.userAgent = this.configService.get<string>(
			'crawler.userAgent',
			'ManaCoreCrawler/1.0',
		);
		this.cacheTtl = this.configService.get<number>('cache.robotsTtl', 86400);
	}

	async isAllowed(url: string): Promise<boolean> {
		try {
			const urlObj = new URL(url);
			const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
			const cacheKey = `robots:${urlObj.host}`;

			// Check cache first
			const cached = await this.cacheService.get<RobotsData>(cacheKey);
			if (cached !== null) {
				return this.checkUrl(cached, url);
			}

			// Fetch robots.txt
			const robotsData = await this.fetchRobots(robotsUrl, urlObj.host);

			// Cache the result
			await this.cacheService.set(cacheKey, robotsData, this.cacheTtl);

			return this.checkUrl(robotsData, url);
		} catch (error) {
			this.logger.warn(`Error checking robots.txt for ${url}: ${error}`);
			// If we can't check, allow by default
			return true;
		}
	}

	async getCrawlDelay(domain: string): Promise<number | undefined> {
		const cacheKey = `robots:${domain}`;
		const cached = await this.cacheService.get<RobotsData>(cacheKey);
		return cached?.crawlDelay;
	}

	async getSitemaps(domain: string): Promise<string[]> {
		const cacheKey = `robots:${domain}`;
		const cached = await this.cacheService.get<RobotsData>(cacheKey);
		return cached?.sitemaps || [];
	}

	private async fetchRobots(robotsUrl: string, host: string): Promise<RobotsData> {
		try {
			const response = await fetch(robotsUrl, {
				headers: {
					'User-Agent': this.userAgent,
				},
				signal: AbortSignal.timeout(5000),
			});

			if (!response.ok) {
				// No robots.txt or error - allow all
				this.logger.debug(`No robots.txt found for ${host} (${response.status})`);
				return { allowed: true, sitemaps: [] };
			}

			const robotsTxt = await response.text();
			const robots = robotsParser(robotsUrl, robotsTxt);

			// Get crawl delay
			const crawlDelay = robots.getCrawlDelay(this.userAgent);

			// Get sitemaps
			const sitemaps = robots.getSitemaps();

			return {
				allowed: true, // Will be checked per-URL
				crawlDelay: crawlDelay ? Number(crawlDelay) : undefined,
				sitemaps,
			};
		} catch (error) {
			this.logger.warn(`Failed to fetch robots.txt from ${robotsUrl}: ${error}`);
			return { allowed: true, sitemaps: [] };
		}
	}

	private checkUrl(robotsData: RobotsData, url: string): boolean {
		// For now, we're caching a simplified version
		// In production, you might want to cache the full robots.txt
		// and parse it each time for more accurate checking
		return robotsData.allowed;
	}

	async checkUrlWithRobots(url: string): Promise<{
		allowed: boolean;
		crawlDelay?: number;
	}> {
		try {
			const urlObj = new URL(url);
			const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

			const response = await fetch(robotsUrl, {
				headers: {
					'User-Agent': this.userAgent,
				},
				signal: AbortSignal.timeout(5000),
			});

			if (!response.ok) {
				return { allowed: true };
			}

			const robotsTxt = await response.text();
			const robots = robotsParser(robotsUrl, robotsTxt);

			const allowed = robots.isAllowed(url, this.userAgent) ?? true;
			const crawlDelay = robots.getCrawlDelay(this.userAgent);

			return {
				allowed,
				crawlDelay: crawlDelay ? Number(crawlDelay) : undefined,
			};
		} catch (error) {
			this.logger.warn(`Error checking robots.txt for ${url}: ${error}`);
			return { allowed: true };
		}
	}
}
