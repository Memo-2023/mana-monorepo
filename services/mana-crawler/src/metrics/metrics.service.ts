import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
	private requestCounter: client.Counter;
	private requestDuration: client.Histogram;
	private cacheHitCounter: client.Counter;
	private cacheMissCounter: client.Counter;
	private crawlJobsGauge: client.Gauge;
	private pagesProcessedCounter: client.Counter;
	private crawlErrorsCounter: client.Counter;

	onModuleInit() {
		// Clear default metrics and register new ones
		client.register.clear();
		client.collectDefaultMetrics({ prefix: 'mana_crawler_' });

		this.requestCounter = new client.Counter({
			name: 'mana_crawler_requests_total',
			help: 'Total number of requests',
			labelNames: ['method', 'endpoint', 'status'],
		});

		this.requestDuration = new client.Histogram({
			name: 'mana_crawler_request_duration_ms',
			help: 'Request duration in milliseconds',
			labelNames: ['method', 'endpoint'],
			buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
		});

		this.cacheHitCounter = new client.Counter({
			name: 'mana_crawler_cache_hits_total',
			help: 'Total number of cache hits',
		});

		this.cacheMissCounter = new client.Counter({
			name: 'mana_crawler_cache_misses_total',
			help: 'Total number of cache misses',
		});

		this.crawlJobsGauge = new client.Gauge({
			name: 'mana_crawler_jobs_active',
			help: 'Number of active crawl jobs',
			labelNames: ['status'],
		});

		this.pagesProcessedCounter = new client.Counter({
			name: 'mana_crawler_pages_processed_total',
			help: 'Total number of pages processed',
			labelNames: ['status'],
		});

		this.crawlErrorsCounter = new client.Counter({
			name: 'mana_crawler_errors_total',
			help: 'Total number of crawl errors',
			labelNames: ['type'],
		});
	}

	recordRequest(endpoint: string, status: number, durationMs: number, method = 'GET') {
		this.requestCounter.inc({ method, endpoint, status: String(status) });
		this.requestDuration.observe({ method, endpoint }, durationMs);
	}

	recordCacheHit() {
		this.cacheHitCounter.inc();
	}

	recordCacheMiss() {
		this.cacheMissCounter.inc();
	}

	setActiveJobs(status: string, count: number) {
		this.crawlJobsGauge.set({ status }, count);
	}

	recordPageProcessed(status: 'success' | 'error') {
		this.pagesProcessedCounter.inc({ status });
	}

	recordCrawlError(type: string) {
		this.crawlErrorsCounter.inc({ type });
	}

	async getMetrics(): Promise<string> {
		return client.register.metrics();
	}

	getContentType(): string {
		return client.register.contentType;
	}
}
