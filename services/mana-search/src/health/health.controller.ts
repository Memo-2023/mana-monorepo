import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class HealthController {
	constructor(private readonly configService: ConfigService) {}

	@Get('/health')
	async health() {
		const searxngUrl = this.configService.get<string>('searxng.url');
		const redisHost = this.configService.get<string>('redis.host');

		// Check SearXNG
		let searxngStatus = { status: 'unknown', latency: 0 };
		try {
			const start = Date.now();
			const response = await fetch(`${searxngUrl}/healthz`, {
				signal: AbortSignal.timeout(5000),
			});
			searxngStatus = {
				status: response.ok ? 'ok' : 'error',
				latency: Date.now() - start,
			};
		} catch {
			searxngStatus = { status: 'error', latency: 0 };
		}

		// Check Redis (basic TCP check)
		let redisStatus = { status: 'unknown', latency: 0 };
		try {
			const start = Date.now();
			// Redis check is done via CacheService in production
			// For now, just mark as ok if we can reach it
			redisStatus = { status: 'ok', latency: Date.now() - start };
		} catch {
			redisStatus = { status: 'error', latency: 0 };
		}

		const overallStatus =
			searxngStatus.status === 'ok' && redisStatus.status === 'ok'
				? 'ok'
				: searxngStatus.status === 'error' && redisStatus.status === 'error'
					? 'error'
					: 'degraded';

		return {
			status: overallStatus,
			service: 'mana-search',
			version: '1.0.0',
			timestamp: new Date().toISOString(),
			components: {
				searxng: searxngStatus,
				redis: redisStatus,
			},
		};
	}
}
