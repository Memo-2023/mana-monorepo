import { CrawlJob, CrawlResult, CrawlProgress } from '../../db/schema';

export interface CrawlJobResponse {
	jobId: string;
	status: string;
	startUrl: string;
	domain: string;
	config: {
		maxDepth: number;
		maxPages: number;
		rateLimit: number;
		respectRobots: boolean;
		includePatterns?: string[];
		excludePatterns?: string[];
	};
	progress: CrawlProgress;
	startedAt?: string;
	completedAt?: string;
	createdAt: string;
	error?: string;
}

export interface CrawlResultResponse {
	id: string;
	url: string;
	parentUrl?: string;
	depth: number;
	title?: string;
	content?: string;
	markdown?: string;
	links?: string[];
	metadata?: Record<string, unknown>;
	statusCode?: number;
	error?: string;
	fetchDurationMs?: number;
	parseDurationMs?: number;
	contentLength?: number;
	createdAt: string;
}

export interface PaginatedResults<T> {
	results: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export function toCrawlJobResponse(job: CrawlJob): CrawlJobResponse {
	return {
		jobId: job.id,
		status: job.status,
		startUrl: job.startUrl,
		domain: job.domain,
		config: {
			maxDepth: job.maxDepth,
			maxPages: job.maxPages,
			rateLimit: job.rateLimit,
			respectRobots: job.respectRobots,
			includePatterns: job.includePatterns ?? undefined,
			excludePatterns: job.excludePatterns ?? undefined,
		},
		progress: job.progress || { discovered: 0, crawled: 0, failed: 0, queued: 0 },
		startedAt: job.startedAt?.toISOString(),
		completedAt: job.completedAt?.toISOString(),
		createdAt: job.createdAt.toISOString(),
		error: job.error ?? undefined,
	};
}

export function toCrawlResultResponse(result: CrawlResult): CrawlResultResponse {
	return {
		id: result.id,
		url: result.url,
		parentUrl: result.parentUrl ?? undefined,
		depth: result.depth,
		title: result.title ?? undefined,
		content: result.content ?? undefined,
		markdown: result.markdown ?? undefined,
		links: result.links ?? undefined,
		metadata: result.metadata ?? undefined,
		statusCode: result.statusCode ?? undefined,
		error: result.error ?? undefined,
		fetchDurationMs: result.fetchDurationMs ?? undefined,
		parseDurationMs: result.parseDurationMs ?? undefined,
		contentLength: result.contentLength ?? undefined,
		createdAt: result.createdAt.toISOString(),
	};
}
