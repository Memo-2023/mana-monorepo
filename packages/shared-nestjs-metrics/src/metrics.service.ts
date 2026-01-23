import { Injectable, OnModuleInit } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics, register } from 'prom-client';

export interface MetricsServiceOptions {
	prefix?: string;
	defaultLabels?: Record<string, string>;
	collectDefaultMetrics?: boolean;
}

@Injectable()
export class MetricsService implements OnModuleInit {
	private readonly registry: Registry;
	private readonly httpRequestsTotal: Counter;
	private readonly httpRequestDuration: Histogram;
	private readonly httpRequestsInFlight: Gauge;

	constructor(private readonly options: MetricsServiceOptions = {}) {
		this.registry = register;

		const prefix = options.prefix || '';

		// Set default labels if provided
		if (options.defaultLabels) {
			this.registry.setDefaultLabels(options.defaultLabels);
		}

		// HTTP Request Counter
		this.httpRequestsTotal = new Counter({
			name: `${prefix}http_requests_total`,
			help: 'Total number of HTTP requests',
			labelNames: ['method', 'path', 'status'],
			registers: [this.registry],
		});

		// HTTP Request Duration Histogram
		this.httpRequestDuration = new Histogram({
			name: `${prefix}http_request_duration_seconds`,
			help: 'HTTP request duration in seconds',
			labelNames: ['method', 'path', 'status'],
			buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
			registers: [this.registry],
		});

		// HTTP Requests In Flight
		this.httpRequestsInFlight = new Gauge({
			name: `${prefix}http_requests_in_flight`,
			help: 'Number of HTTP requests currently being processed',
			labelNames: ['method'],
			registers: [this.registry],
		});
	}

	onModuleInit() {
		// Collect default Node.js metrics (CPU, memory, event loop, etc.)
		if (this.options.collectDefaultMetrics !== false) {
			collectDefaultMetrics({
				register: this.registry,
				prefix: this.options.prefix || '',
			});
		}
	}

	/**
	 * Increment HTTP request counter
	 */
	incrementHttpRequests(method: string, path: string, status: number): void {
		this.httpRequestsTotal.inc({
			method,
			path: this.normalizePath(path),
			status: String(status),
		});
	}

	/**
	 * Observe HTTP request duration
	 */
	observeHttpDuration(method: string, path: string, status: number, durationMs: number): void {
		this.httpRequestDuration.observe(
			{
				method,
				path: this.normalizePath(path),
				status: String(status),
			},
			durationMs / 1000 // Convert to seconds
		);
	}

	/**
	 * Increment in-flight requests
	 */
	incrementInFlight(method: string): void {
		this.httpRequestsInFlight.inc({ method });
	}

	/**
	 * Decrement in-flight requests
	 */
	decrementInFlight(method: string): void {
		this.httpRequestsInFlight.dec({ method });
	}

	/**
	 * Get all metrics as Prometheus text format
	 */
	async getMetrics(): Promise<string> {
		return this.registry.metrics();
	}

	/**
	 * Get content type for metrics endpoint
	 */
	getContentType(): string {
		return this.registry.contentType;
	}

	/**
	 * Create a custom counter
	 */
	createCounter(name: string, help: string, labelNames: string[] = []): Counter {
		return new Counter({
			name: this.options.prefix ? `${this.options.prefix}${name}` : name,
			help,
			labelNames,
			registers: [this.registry],
		});
	}

	/**
	 * Create a custom histogram
	 */
	createHistogram(
		name: string,
		help: string,
		labelNames: string[] = [],
		buckets?: number[]
	): Histogram {
		return new Histogram({
			name: this.options.prefix ? `${this.options.prefix}${name}` : name,
			help,
			labelNames,
			buckets,
			registers: [this.registry],
		});
	}

	/**
	 * Create a custom gauge
	 */
	createGauge(name: string, help: string, labelNames: string[] = []): Gauge {
		return new Gauge({
			name: this.options.prefix ? `${this.options.prefix}${name}` : name,
			help,
			labelNames,
			registers: [this.registry],
		});
	}

	/**
	 * Normalize path to prevent high cardinality
	 * Replaces UUIDs and numeric IDs with placeholders
	 */
	private normalizePath(path: string): string {
		return (
			path
				// Replace UUIDs
				.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
				// Replace numeric IDs
				.replace(/\/\d+/g, '/:id')
				// Remove query strings
				.split('?')[0]
		);
	}
}
