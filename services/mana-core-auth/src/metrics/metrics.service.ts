import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
	private readonly register: client.Registry;

	// HTTP metrics
	readonly httpRequestsTotal: client.Counter<string>;
	readonly httpRequestDuration: client.Histogram<string>;

	constructor() {
		this.register = new client.Registry();

		// Add default metrics (CPU, memory, event loop, etc.)
		client.collectDefaultMetrics({
			register: this.register,
			prefix: 'auth_',
		});

		// HTTP request counter
		this.httpRequestsTotal = new client.Counter({
			name: 'http_requests_total',
			help: 'Total number of HTTP requests',
			labelNames: ['method', 'route', 'status'],
			registers: [this.register],
		});

		// HTTP request duration histogram
		this.httpRequestDuration = new client.Histogram({
			name: 'http_request_duration_seconds',
			help: 'Duration of HTTP requests in seconds',
			labelNames: ['method', 'route', 'status'],
			buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
			registers: [this.register],
		});
	}

	onModuleInit() {
		// Metrics are ready
	}

	async getMetrics(): Promise<string> {
		return this.register.metrics();
	}

	getContentType(): string {
		return this.register.contentType;
	}
}
