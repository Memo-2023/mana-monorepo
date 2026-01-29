import { Injectable, Logger, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, desc, count } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { crawlJobs, crawlResults, type NewCrawlJob, type CrawlJob, type CrawlResult } from '../db/schema';
import { QueueService } from '../queue/queue.service';
import { MetricsService } from '../metrics/metrics.service';
import { StartCrawlDto } from './dto/start-crawl.dto';
import {
	CrawlJobResponse,
	CrawlResultResponse,
	PaginatedResults,
	toCrawlJobResponse,
	toCrawlResultResponse,
} from './dto/crawl-response.dto';

@Injectable()
export class CrawlerService {
	private readonly logger = new Logger(CrawlerService.name);
	private readonly defaultMaxDepth: number;
	private readonly defaultMaxPages: number;
	private readonly defaultRateLimit: number;

	constructor(
		private readonly configService: ConfigService,
		private readonly queueService: QueueService,
		private readonly metricsService: MetricsService,
		@Inject(DATABASE_CONNECTION) private readonly db: any,
	) {
		this.defaultMaxDepth = this.configService.get<number>('crawler.defaultMaxDepth', 3);
		this.defaultMaxPages = this.configService.get<number>('crawler.defaultMaxPages', 100);
		this.defaultRateLimit = this.configService.get<number>('crawler.defaultRateLimit', 2);
	}

	async startCrawl(dto: StartCrawlDto, userId?: string, apiKeyId?: string): Promise<CrawlJobResponse> {
		const startUrl = new URL(dto.startUrl);
		const domain = startUrl.hostname;

		const config = dto.config || {};

		const newJob: NewCrawlJob = {
			startUrl: dto.startUrl,
			domain,
			maxDepth: config.maxDepth ?? this.defaultMaxDepth,
			maxPages: config.maxPages ?? this.defaultMaxPages,
			rateLimit: config.rateLimit ?? this.defaultRateLimit,
			respectRobots: config.respectRobots ?? true,
			includePatterns: config.includePatterns,
			excludePatterns: config.excludePatterns,
			selectors: config.selectors,
			output: config.output,
			webhookUrl: dto.webhookUrl,
			userId,
			apiKeyId,
			status: 'pending',
			progress: {
				discovered: 0,
				crawled: 0,
				failed: 0,
				queued: 0,
			},
		};

		// Insert job into database
		const [createdJob] = await this.db
			.insert(crawlJobs)
			.values(newJob)
			.returning();

		this.logger.log(`Created crawl job ${createdJob.id} for ${domain}`);

		// Add to queue
		try {
			await this.queueService.addCrawlJob(createdJob);

			// Update status to running
			const [updatedJob] = await this.db
				.update(crawlJobs)
				.set({
					status: 'running',
					startedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(crawlJobs.id, createdJob.id))
				.returning();

			this.metricsService.setActiveJobs('running', 1);

			return toCrawlJobResponse(updatedJob);
		} catch (error) {
			// Update status to failed
			await this.db
				.update(crawlJobs)
				.set({
					status: 'failed',
					error: error instanceof Error ? error.message : 'Failed to queue job',
					updatedAt: new Date(),
				})
				.where(eq(crawlJobs.id, createdJob.id));

			throw error;
		}
	}

	async getJob(jobId: string): Promise<CrawlJobResponse> {
		const [job] = await this.db
			.select()
			.from(crawlJobs)
			.where(eq(crawlJobs.id, jobId))
			.limit(1);

		if (!job) {
			throw new NotFoundException(`Crawl job ${jobId} not found`);
		}

		return toCrawlJobResponse(job);
	}

	async getJobResults(
		jobId: string,
		page = 1,
		limit = 50,
	): Promise<PaginatedResults<CrawlResultResponse>> {
		// Verify job exists
		const [job] = await this.db
			.select()
			.from(crawlJobs)
			.where(eq(crawlJobs.id, jobId))
			.limit(1);

		if (!job) {
			throw new NotFoundException(`Crawl job ${jobId} not found`);
		}

		// Get total count
		const [{ total }] = await this.db
			.select({ total: count() })
			.from(crawlResults)
			.where(eq(crawlResults.jobId, jobId));

		// Get paginated results
		const offset = (page - 1) * limit;
		const results = await this.db
			.select()
			.from(crawlResults)
			.where(eq(crawlResults.jobId, jobId))
			.orderBy(desc(crawlResults.createdAt))
			.limit(limit)
			.offset(offset);

		return {
			results: results.map(toCrawlResultResponse),
			pagination: {
				page,
				limit,
				total: Number(total),
				totalPages: Math.ceil(Number(total) / limit),
			},
		};
	}

	async cancelJob(jobId: string): Promise<CrawlJobResponse> {
		const [job] = await this.db
			.select()
			.from(crawlJobs)
			.where(eq(crawlJobs.id, jobId))
			.limit(1);

		if (!job) {
			throw new NotFoundException(`Crawl job ${jobId} not found`);
		}

		if (['completed', 'failed', 'cancelled'].includes(job.status)) {
			throw new BadRequestException(`Cannot cancel job with status: ${job.status}`);
		}

		// Cancel queue jobs
		await this.queueService.cancelJob(jobId);

		// Update status
		const [updatedJob] = await this.db
			.update(crawlJobs)
			.set({
				status: 'cancelled',
				completedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(crawlJobs.id, jobId))
			.returning();

		this.logger.log(`Cancelled crawl job ${jobId}`);

		return toCrawlJobResponse(updatedJob);
	}

	async pauseJob(jobId: string): Promise<CrawlJobResponse> {
		const [job] = await this.db
			.select()
			.from(crawlJobs)
			.where(eq(crawlJobs.id, jobId))
			.limit(1);

		if (!job) {
			throw new NotFoundException(`Crawl job ${jobId} not found`);
		}

		if (job.status !== 'running') {
			throw new BadRequestException(`Cannot pause job with status: ${job.status}`);
		}

		// Pause queue jobs
		await this.queueService.pauseJob(jobId);

		// Update status
		const [updatedJob] = await this.db
			.update(crawlJobs)
			.set({
				status: 'paused',
				updatedAt: new Date(),
			})
			.where(eq(crawlJobs.id, jobId))
			.returning();

		this.logger.log(`Paused crawl job ${jobId}`);

		return toCrawlJobResponse(updatedJob);
	}

	async resumeJob(jobId: string): Promise<CrawlJobResponse> {
		const [job] = await this.db
			.select()
			.from(crawlJobs)
			.where(eq(crawlJobs.id, jobId))
			.limit(1);

		if (!job) {
			throw new NotFoundException(`Crawl job ${jobId} not found`);
		}

		if (job.status !== 'paused') {
			throw new BadRequestException(`Cannot resume job with status: ${job.status}`);
		}

		// Re-add to queue
		await this.queueService.addCrawlJob(job);

		// Update status
		const [updatedJob] = await this.db
			.update(crawlJobs)
			.set({
				status: 'running',
				updatedAt: new Date(),
			})
			.where(eq(crawlJobs.id, jobId))
			.returning();

		this.logger.log(`Resumed crawl job ${jobId}`);

		return toCrawlJobResponse(updatedJob);
	}

	async listJobs(
		page = 1,
		limit = 20,
		status?: string,
		userId?: string,
	): Promise<PaginatedResults<CrawlJobResponse>> {
		let query = this.db.select().from(crawlJobs);

		// Build conditions
		const conditions = [];
		if (status) {
			conditions.push(eq(crawlJobs.status, status));
		}
		if (userId) {
			conditions.push(eq(crawlJobs.userId, userId));
		}

		if (conditions.length > 0) {
			query = query.where(conditions[0]);
			for (let i = 1; i < conditions.length; i++) {
				query = query.where(conditions[i]);
			}
		}

		// Get total count
		let countQuery = this.db.select({ total: count() }).from(crawlJobs);
		if (conditions.length > 0) {
			countQuery = countQuery.where(conditions[0]);
			for (let i = 1; i < conditions.length; i++) {
				countQuery = countQuery.where(conditions[i]);
			}
		}
		const [{ total }] = await countQuery;

		// Get paginated results
		const offset = (page - 1) * limit;
		const jobs = await query
			.orderBy(desc(crawlJobs.createdAt))
			.limit(limit)
			.offset(offset);

		return {
			results: jobs.map(toCrawlJobResponse),
			pagination: {
				page,
				limit,
				total: Number(total),
				totalPages: Math.ceil(Number(total) / limit),
			},
		};
	}

	async deleteJob(jobId: string): Promise<void> {
		const [job] = await this.db
			.select()
			.from(crawlJobs)
			.where(eq(crawlJobs.id, jobId))
			.limit(1);

		if (!job) {
			throw new NotFoundException(`Crawl job ${jobId} not found`);
		}

		// Cancel if running
		if (['running', 'pending', 'paused'].includes(job.status)) {
			await this.queueService.cancelJob(jobId);
		}

		// Delete job (results will be cascade deleted)
		await this.db
			.delete(crawlJobs)
			.where(eq(crawlJobs.id, jobId));

		this.logger.log(`Deleted crawl job ${jobId}`);
	}
}
