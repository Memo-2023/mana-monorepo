import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();
register.setDefaultLabels({ service: 'mana-media' });
collectDefaultMetrics({ register, prefix: 'media_' });

export const httpRequestsTotal = new Counter({
	name: 'media_http_requests_total',
	help: 'Total HTTP requests',
	labelNames: ['method', 'path', 'status'],
	registers: [register],
});

export const httpRequestDuration = new Histogram({
	name: 'media_http_request_duration_seconds',
	help: 'HTTP request duration in seconds',
	labelNames: ['method', 'path', 'status'],
	buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
	registers: [register],
});

@Controller('metrics')
export class MetricsController {
	@Get()
	async getMetrics(@Res() res: Response) {
		res.set('Content-Type', register.contentType);
		res.end(await register.metrics());
	}
}
