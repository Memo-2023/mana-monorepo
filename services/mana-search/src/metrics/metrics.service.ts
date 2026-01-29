import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
	private readonly registry = new Registry();

	// Request Counter
	private readonly requestsTotal: Counter<string>;

	// Latency Histogram
	private readonly latency: Histogram<string>;

	// Cache Metrics
	private readonly cacheHits: Counter<string>;
	private readonly cacheMisses: Counter<string>;

	// SearXNG Engine Status
	private readonly engineStatus: Gauge<string>;

	// Active searches
	private readonly activeSearches: Gauge<string>;

	constructor() {
		// Collect default Node.js metrics
		collectDefaultMetrics({ register: this.registry });

		this.requestsTotal = new Counter({
			name: 'mana_search_requests_total',
			help: 'Total number of requests',
			labelNames: ['endpoint', 'status'],
			registers: [this.registry],
		});

		this.latency = new Histogram({
			name: 'mana_search_latency_seconds',
			help: 'Request latency in seconds',
			labelNames: ['endpoint'],
			buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10],
			registers: [this.registry],
		});

		this.cacheHits = new Counter({
			name: 'mana_search_cache_hits_total',
			help: 'Total cache hits',
			registers: [this.registry],
		});

		this.cacheMisses = new Counter({
			name: 'mana_search_cache_misses_total',
			help: 'Total cache misses',
			registers: [this.registry],
		});

		this.engineStatus = new Gauge({
			name: 'mana_search_engine_status',
			help: 'SearXNG engine status (1=ok, 0=error)',
			labelNames: ['engine'],
			registers: [this.registry],
		});

		this.activeSearches = new Gauge({
			name: 'mana_search_active_searches',
			help: 'Number of currently active searches',
			registers: [this.registry],
		});
	}

	recordRequest(endpoint: string, status: number, durationMs: number) {
		this.requestsTotal.inc({ endpoint, status: String(status) });
		this.latency.observe({ endpoint }, durationMs / 1000);
	}

	recordCacheHit() {
		this.cacheHits.inc();
	}

	recordCacheMiss() {
		this.cacheMisses.inc();
	}

	setEngineStatus(engine: string, isOk: boolean) {
		this.engineStatus.set({ engine }, isOk ? 1 : 0);
	}

	incrementActiveSearches() {
		this.activeSearches.inc();
	}

	decrementActiveSearches() {
		this.activeSearches.dec();
	}

	async getMetrics(): Promise<string> {
		return this.registry.metrics();
	}

	async getContentType(): Promise<string> {
		return this.registry.contentType;
	}
}
