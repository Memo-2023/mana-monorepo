import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bullmq';
import { eq, sql } from 'drizzle-orm';
import { CRAWL_QUEUE } from '../constants';
import { CrawlPageJob } from '../queue.service';
import { ParserService } from '../../parser/parser.service';
import { RobotsService } from '../../robots/robots.service';
import { CacheService } from '../../cache/cache.service';
import { MetricsService } from '../../metrics/metrics.service';
import { DATABASE_CONNECTION } from '../../db/database.module';
import { crawlJobs, crawlResults, type NewCrawlResult } from '../../db/schema';

@Processor(CRAWL_QUEUE, {
	concurrency: 5,
})
export class CrawlProcessor extends WorkerHost {
	private readonly logger = new Logger(CrawlProcessor.name);
	private readonly userAgent: string;
	private readonly timeout: number;
	private readonly processedUrls = new Map<string, Set<string>>();

	constructor(
		private readonly configService: ConfigService,
		@InjectQueue(CRAWL_QUEUE) private readonly crawlQueue: Queue,
		private readonly parserService: ParserService,
		private readonly robotsService: RobotsService,
		private readonly cacheService: CacheService,
		private readonly metricsService: MetricsService,
		@Inject(DATABASE_CONNECTION) private readonly db: any,
	) {
		super();
		this.userAgent = this.configService.get<string>(
			'crawler.userAgent',
			'ManaCoreCrawler/1.0',
		);
		this.timeout = this.configService.get<number>('crawler.timeout', 30000);
	}

	async process(job: Job<CrawlPageJob>): Promise<void> {
		const { jobId, url, parentUrl, depth, config } = job.data;
		const startTime = Date.now();

		this.logger.debug(`Processing ${url} (depth: ${depth}, job: ${jobId})`);

		try {
			// Check if job is still active
			const [crawlJob] = await this.db
				.select()
				.from(crawlJobs)
				.where(eq(crawlJobs.id, jobId))
				.limit(1);

			if (!crawlJob || ['cancelled', 'paused', 'completed', 'failed'].includes(crawlJob.status)) {
				this.logger.debug(`Job ${jobId} is no longer active, skipping`);
				return;
			}

			// Initialize URL tracking for this job
			if (!this.processedUrls.has(jobId)) {
				this.processedUrls.set(jobId, new Set());
			}
			const processed = this.processedUrls.get(jobId)!;

			// Check if URL already processed
			if (processed.has(url)) {
				this.logger.debug(`URL already processed: ${url}`);
				return;
			}
			processed.add(url);

			// Check max pages limit
			if (crawlJob.progress.crawled >= config.maxPages) {
				this.logger.debug(`Max pages reached for job ${jobId}`);
				await this.completeJob(jobId);
				return;
			}

			// Check robots.txt
			if (config.respectRobots) {
				const robotsCheck = await this.robotsService.checkUrlWithRobots(url);
				if (!robotsCheck.allowed) {
					this.logger.debug(`URL blocked by robots.txt: ${url}`);
					await this.updateProgress(jobId, { failed: 1 });
					return;
				}
			}

			// Check URL patterns
			if (!this.matchesPatterns(url, config.includePatterns, config.excludePatterns)) {
				this.logger.debug(`URL doesn't match patterns: ${url}`);
				return;
			}

			// Fetch the page
			const fetchStart = Date.now();
			const response = await fetch(url, {
				headers: {
					'User-Agent': this.userAgent,
					Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.5',
				},
				signal: AbortSignal.timeout(this.timeout),
			});
			const fetchDuration = Date.now() - fetchStart;

			if (!response.ok) {
				await this.saveResult(jobId, {
					url,
					parentUrl,
					depth,
					statusCode: response.status,
					error: `HTTP ${response.status}`,
					fetchDurationMs: fetchDuration,
				});
				await this.updateProgress(jobId, { crawled: 1, failed: 1 });
				this.metricsService.recordPageProcessed('error');
				return;
			}

			const contentType = response.headers.get('content-type') || '';
			if (!contentType.includes('text/html')) {
				this.logger.debug(`Skipping non-HTML content: ${url}`);
				return;
			}

			const html = await response.text();
			const contentLength = html.length;

			// Parse the page
			const parseStart = Date.now();
			const parsed = this.parserService.parse(html, {
				selectors: config.selectors,
				includeMarkdown: config.output?.format === 'markdown',
				includeHtml: config.output?.format === 'html',
				baseUrl: url,
			});
			const parseDuration = Date.now() - parseStart;

			// Save result
			await this.saveResult(jobId, {
				url,
				parentUrl,
				depth,
				title: parsed.title,
				content: parsed.content,
				markdown: parsed.markdown,
				html: parsed.html,
				links: parsed.links,
				metadata: parsed.metadata,
				statusCode: response.status,
				fetchDurationMs: fetchDuration,
				parseDurationMs: parseDuration,
				contentLength,
			});

			await this.updateProgress(jobId, {
				crawled: 1,
				discovered: parsed.links.length,
			});
			this.metricsService.recordPageProcessed('success');

			// Queue discovered links
			if (depth < config.maxDepth && crawlJob.progress.crawled < config.maxPages) {
				for (const link of parsed.links) {
					if (!processed.has(link)) {
						try {
							const urlHash = Buffer.from(link).toString('base64').slice(0, 32);
							await this.crawlQueue.add(
								'crawl-page',
								{
									jobId,
									url: link,
									parentUrl: url,
									depth: depth + 1,
									config,
								} as CrawlPageJob,
								{
									jobId: `${jobId}-${urlHash}`,
									delay: Math.floor(1000 / config.rateLimit),
								},
							);
						} catch (error) {
							// Job might already exist, ignore
						}
					}
				}
			}

			this.logger.debug(
				`Processed ${url} in ${Date.now() - startTime}ms (${parsed.links.length} links found)`,
			);
		} catch (error) {
			this.logger.error(`Error processing ${url}: ${error}`);
			this.metricsService.recordCrawlError('fetch_error');

			await this.saveResult(jobId, {
				url,
				parentUrl,
				depth,
				error: error instanceof Error ? error.message : 'Unknown error',
				fetchDurationMs: Date.now() - startTime,
			});

			await this.updateProgress(jobId, { crawled: 1, failed: 1 });
			throw error; // Let BullMQ handle retries
		}
	}

	@OnWorkerEvent('completed')
	async onCompleted(job: Job<CrawlPageJob>) {
		// Check if this was the last job for this crawl
		const { jobId } = job.data;
		const counts = await this.crawlQueue.getJobCounts(
			'waiting',
			'active',
			'delayed',
		);

		if ((counts.waiting ?? 0) === 0 && (counts.active ?? 0) === 0 && (counts.delayed ?? 0) === 0) {
			// Check if there are jobs for this specific crawl
			const [crawlJob] = await this.db
				.select()
				.from(crawlJobs)
				.where(eq(crawlJobs.id, jobId))
				.limit(1);

			if (crawlJob && crawlJob.status === 'running') {
				await this.completeJob(jobId);
			}
		}
	}

	@OnWorkerEvent('failed')
	onFailed(job: Job<CrawlPageJob>, error: Error) {
		this.logger.error(`Job ${job.id} failed: ${error.message}`);
		this.metricsService.recordCrawlError('job_failed');
	}

	private matchesPatterns(
		url: string,
		includePatterns?: string[],
		excludePatterns?: string[],
	): boolean {
		// Check exclude patterns first
		if (excludePatterns?.length) {
			for (const pattern of excludePatterns) {
				if (this.matchPattern(url, pattern)) {
					return false;
				}
			}
		}

		// If no include patterns, allow all
		if (!includePatterns?.length) {
			return true;
		}

		// Check include patterns
		for (const pattern of includePatterns) {
			if (this.matchPattern(url, pattern)) {
				return true;
			}
		}

		return false;
	}

	private matchPattern(url: string, pattern: string): boolean {
		// Simple glob pattern matching
		const regex = pattern
			.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			.replace(/\\\*/g, '.*')
			.replace(/\\\?/g, '.');
		return new RegExp(regex).test(url);
	}

	private async saveResult(
		jobId: string,
		result: Omit<NewCrawlResult, 'id' | 'jobId' | 'createdAt'>,
	): Promise<void> {
		try {
			await this.db.insert(crawlResults).values({
				jobId,
				...result,
			});
		} catch (error) {
			this.logger.error(`Failed to save result for ${result.url}: ${error}`);
		}
	}

	private async updateProgress(
		jobId: string,
		delta: { discovered?: number; crawled?: number; failed?: number; queued?: number },
	): Promise<void> {
		try {
			const updates: string[] = [];
			if (delta.discovered) {
				updates.push(`'discovered', COALESCE((progress->>'discovered')::int, 0) + ${delta.discovered}`);
			}
			if (delta.crawled) {
				updates.push(`'crawled', COALESCE((progress->>'crawled')::int, 0) + ${delta.crawled}`);
			}
			if (delta.failed) {
				updates.push(`'failed', COALESCE((progress->>'failed')::int, 0) + ${delta.failed}`);
			}
			if (delta.queued) {
				updates.push(`'queued', COALESCE((progress->>'queued')::int, 0) + ${delta.queued}`);
			}

			if (updates.length > 0) {
				await this.db
					.update(crawlJobs)
					.set({
						progress: sql`jsonb_build_object(
							'discovered', COALESCE((progress->>'discovered')::int, 0) + ${delta.discovered || 0},
							'crawled', COALESCE((progress->>'crawled')::int, 0) + ${delta.crawled || 0},
							'failed', COALESCE((progress->>'failed')::int, 0) + ${delta.failed || 0},
							'queued', COALESCE((progress->>'queued')::int, 0) + ${delta.queued || 0}
						)`,
						updatedAt: new Date(),
					})
					.where(eq(crawlJobs.id, jobId));
			}
		} catch (error) {
			this.logger.error(`Failed to update progress for job ${jobId}: ${error}`);
		}
	}

	private async completeJob(jobId: string): Promise<void> {
		try {
			await this.db
				.update(crawlJobs)
				.set({
					status: 'completed',
					completedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(crawlJobs.id, jobId));

			// Clean up URL tracking
			this.processedUrls.delete(jobId);

			this.logger.log(`Crawl job ${jobId} completed`);
		} catch (error) {
			this.logger.error(`Failed to complete job ${jobId}: ${error}`);
		}
	}
}
