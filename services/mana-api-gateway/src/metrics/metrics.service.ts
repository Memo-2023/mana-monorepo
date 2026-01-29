import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
	private readonly register: client.Registry;

	// Counters
	public readonly requestsTotal: client.Counter<string>;
	public readonly creditsUsedTotal: client.Counter<string>;
	public readonly errorsTotal: client.Counter<string>;

	// Histograms
	public readonly requestDuration: client.Histogram<string>;

	// Gauges
	public readonly activeApiKeys: client.Gauge<string>;
	public readonly rateLimitExceeded: client.Counter<string>;

	constructor() {
		this.register = new client.Registry();

		// Add default metrics
		client.collectDefaultMetrics({ register: this.register });

		// Custom metrics
		this.requestsTotal = new client.Counter({
			name: 'api_gateway_requests_total',
			help: 'Total number of API requests',
			labelNames: ['endpoint', 'method', 'status', 'tier'],
			registers: [this.register],
		});

		this.creditsUsedTotal = new client.Counter({
			name: 'api_gateway_credits_used_total',
			help: 'Total credits consumed',
			labelNames: ['endpoint', 'tier'],
			registers: [this.register],
		});

		this.errorsTotal = new client.Counter({
			name: 'api_gateway_errors_total',
			help: 'Total number of errors',
			labelNames: ['endpoint', 'error_type'],
			registers: [this.register],
		});

		this.requestDuration = new client.Histogram({
			name: 'api_gateway_request_duration_seconds',
			help: 'Request duration in seconds',
			labelNames: ['endpoint', 'method'],
			buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
			registers: [this.register],
		});

		this.activeApiKeys = new client.Gauge({
			name: 'api_gateway_active_api_keys',
			help: 'Number of active API keys',
			labelNames: ['tier'],
			registers: [this.register],
		});

		this.rateLimitExceeded = new client.Counter({
			name: 'api_gateway_rate_limit_exceeded_total',
			help: 'Total number of rate limit exceeded events',
			labelNames: ['tier'],
			registers: [this.register],
		});
	}

	onModuleInit() {
		// Initial setup if needed
	}

	async getMetrics(): Promise<string> {
		return this.register.metrics();
	}

	getContentType(): string {
		return this.register.contentType;
	}
}
