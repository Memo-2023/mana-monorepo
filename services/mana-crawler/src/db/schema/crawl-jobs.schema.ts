import {
	pgSchema,
	uuid,
	text,
	integer,
	boolean,
	timestamp,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';

export const crawlerSchema = pgSchema('crawler');

export interface CrawlSelectors {
	title?: string;
	content?: string;
	links?: string;
	custom?: Record<string, string>;
}

export interface CrawlProgress {
	discovered: number;
	crawled: number;
	failed: number;
	queued: number;
}

export interface CrawlOutput {
	format?: 'text' | 'html' | 'markdown';
}

export const crawlJobs = crawlerSchema.table(
	'crawl_jobs',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		// Job config
		startUrl: text('start_url').notNull(),
		domain: text('domain').notNull(),
		maxDepth: integer('max_depth').notNull().default(3),
		maxPages: integer('max_pages').notNull().default(100),
		rateLimit: integer('rate_limit').notNull().default(2), // requests/second

		// URL patterns
		includePatterns: jsonb('include_patterns').$type<string[]>(),
		excludePatterns: jsonb('exclude_patterns').$type<string[]>(),

		// Selectors for extraction
		selectors: jsonb('selectors').$type<CrawlSelectors>(),

		// Output options
		output: jsonb('output').$type<CrawlOutput>(),

		// Robots.txt
		respectRobots: boolean('respect_robots').notNull().default(true),

		// Status
		status: text('status').notNull().default('pending'), // pending, running, paused, completed, failed, cancelled
		progress: jsonb('progress').$type<CrawlProgress>().default({
			discovered: 0,
			crawled: 0,
			failed: 0,
			queued: 0,
		}),
		error: text('error'),

		// Metadata
		userId: text('user_id'),
		apiKeyId: uuid('api_key_id'),
		webhookUrl: text('webhook_url'),

		// Bull queue job ID
		bullJobId: text('bull_job_id'),

		// Timestamps
		startedAt: timestamp('started_at', { withTimezone: true }),
		completedAt: timestamp('completed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		statusIdx: index('crawl_jobs_status_idx').on(table.status),
		userIdIdx: index('crawl_jobs_user_id_idx').on(table.userId),
		domainIdx: index('crawl_jobs_domain_idx').on(table.domain),
	}),
);

export type CrawlJob = typeof crawlJobs.$inferSelect;
export type NewCrawlJob = typeof crawlJobs.$inferInsert;
