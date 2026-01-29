import {
	uuid,
	text,
	integer,
	timestamp,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';
import { crawlerSchema, crawlJobs } from './crawl-jobs.schema';

export const crawlResults = crawlerSchema.table(
	'crawl_results',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		jobId: uuid('job_id')
			.references(() => crawlJobs.id, { onDelete: 'cascade' })
			.notNull(),

		// Page data
		url: text('url').notNull(),
		parentUrl: text('parent_url'),
		depth: integer('depth').notNull(),

		// Extracted content
		title: text('title'),
		content: text('content'),
		markdown: text('markdown'),
		html: text('html'),
		metadata: jsonb('metadata').$type<Record<string, unknown>>(),

		// Links found
		links: jsonb('links').$type<string[]>(),

		// Status
		statusCode: integer('status_code'),
		error: text('error'),

		// Performance
		fetchDurationMs: integer('fetch_duration_ms'),
		parseDurationMs: integer('parse_duration_ms'),
		contentLength: integer('content_length'),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		jobIdIdx: index('crawl_results_job_id_idx').on(table.jobId),
		urlIdx: index('crawl_results_url_idx').on(table.url),
		jobUrlUnique: index('crawl_results_job_url_idx').on(table.jobId, table.url),
	}),
);

export type CrawlResult = typeof crawlResults.$inferSelect;
export type NewCrawlResult = typeof crawlResults.$inferInsert;
