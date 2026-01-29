import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { CRAWL_QUEUE } from './constants';
import { CrawlJob } from '../db/schema';

export interface CrawlPageJob {
	jobId: string;
	url: string;
	parentUrl?: string;
	depth: number;
	config: {
		maxDepth: number;
		maxPages: number;
		rateLimit: number;
		respectRobots: boolean;
		includePatterns?: string[];
		excludePatterns?: string[];
		selectors?: {
			title?: string;
			content?: string;
			links?: string;
			custom?: Record<string, string>;
		};
		output?: {
			format?: 'text' | 'html' | 'markdown';
		};
	};
}

@Injectable()
export class QueueService {
	private readonly logger = new Logger(QueueService.name);

	constructor(@InjectQueue(CRAWL_QUEUE) private readonly crawlQueue: Queue) {}

	async addCrawlJob(crawlJob: CrawlJob): Promise<Job<CrawlPageJob>> {
		const jobData: CrawlPageJob = {
			jobId: crawlJob.id,
			url: crawlJob.startUrl,
			depth: 0,
			config: {
				maxDepth: crawlJob.maxDepth,
				maxPages: crawlJob.maxPages,
				rateLimit: crawlJob.rateLimit,
				respectRobots: crawlJob.respectRobots,
				includePatterns: crawlJob.includePatterns ?? undefined,
				excludePatterns: crawlJob.excludePatterns ?? undefined,
				selectors: crawlJob.selectors ?? undefined,
				output: crawlJob.output ?? undefined,
			},
		};

		const job = await this.crawlQueue.add('crawl-page', jobData, {
			jobId: `${crawlJob.id}-start`,
		});

		this.logger.log(`Added crawl job ${crawlJob.id} to queue`);
		return job;
	}

	async addPageToQueue(
		jobId: string,
		url: string,
		parentUrl: string,
		depth: number,
		config: CrawlPageJob['config'],
	): Promise<Job<CrawlPageJob>> {
		const jobData: CrawlPageJob = {
			jobId,
			url,
			parentUrl,
			depth,
			config,
		};

		// Use URL hash as job ID to prevent duplicates
		const urlHash = Buffer.from(url).toString('base64').slice(0, 32);
		const job = await this.crawlQueue.add('crawl-page', jobData, {
			jobId: `${jobId}-${urlHash}`,
			delay: Math.floor(1000 / config.rateLimit), // Rate limiting delay
		});

		return job;
	}

	async getJobCounts(): Promise<{
		waiting: number;
		active: number;
		completed: number;
		failed: number;
		delayed: number;
	}> {
		const counts = await this.crawlQueue.getJobCounts(
			'waiting',
			'active',
			'completed',
			'failed',
			'delayed',
		);
		return {
			waiting: counts.waiting ?? 0,
			active: counts.active ?? 0,
			completed: counts.completed ?? 0,
			failed: counts.failed ?? 0,
			delayed: counts.delayed ?? 0,
		};
	}

	async pauseJob(jobId: string): Promise<void> {
		// Get all jobs for this crawl job
		const jobs = await this.crawlQueue.getJobs(['waiting', 'delayed']);
		for (const job of jobs) {
			if (job.data.jobId === jobId) {
				await job.remove();
			}
		}
		this.logger.log(`Paused crawl job ${jobId}`);
	}

	async cancelJob(jobId: string): Promise<void> {
		// Remove all jobs for this crawl job
		const jobs = await this.crawlQueue.getJobs([
			'waiting',
			'delayed',
			'active',
		]);
		for (const job of jobs) {
			if (job.data.jobId === jobId) {
				await job.remove();
			}
		}
		this.logger.log(`Cancelled crawl job ${jobId}`);
	}

	async getQueueStats(): Promise<{
		name: string;
		counts: Record<string, number>;
		isPaused: boolean;
	}> {
		const counts = await this.getJobCounts();
		const isPaused = await this.crawlQueue.isPaused();

		return {
			name: CRAWL_QUEUE,
			counts,
			isPaused,
		};
	}
}
