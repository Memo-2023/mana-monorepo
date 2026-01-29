import { Injectable, OnModuleInit } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
	private registry: Registry;

	public httpRequestsTotal: Counter;
	public httpRequestDuration: Histogram;

	constructor() {
		this.registry = new Registry();

		this.httpRequestsTotal = new Counter({
			name: 'http_requests_total',
			help: 'Total number of HTTP requests',
			labelNames: ['method', 'route', 'status'],
			registers: [this.registry],
		});

		this.httpRequestDuration = new Histogram({
			name: 'http_request_duration_seconds',
			help: 'Duration of HTTP requests in seconds',
			labelNames: ['method', 'route', 'status'],
			buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
			registers: [this.registry],
		});
	}

	onModuleInit() {
		collectDefaultMetrics({ register: this.registry });
	}

	async getMetrics(): Promise<string> {
		return this.registry.metrics();
	}
}
