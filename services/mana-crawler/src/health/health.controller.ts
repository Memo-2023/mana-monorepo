import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import { sql } from 'drizzle-orm';

@Controller()
export class HealthController {
	constructor(
		private readonly configService: ConfigService,
		private readonly cacheService: CacheService,
		@Inject(DATABASE_CONNECTION) private readonly db: any,
	) {}

	@Get('/health')
	async health() {
		// Check Redis
		const redisStatus = await this.cacheService.healthCheck();

		// Check Database
		let dbStatus = { status: 'unknown', latency: 0 };
		try {
			const start = Date.now();
			await this.db.execute(sql`SELECT 1`);
			dbStatus = { status: 'ok', latency: Date.now() - start };
		} catch {
			dbStatus = { status: 'error', latency: 0 };
		}

		const overallStatus =
			redisStatus.status === 'ok' && dbStatus.status === 'ok'
				? 'ok'
				: redisStatus.status === 'error' && dbStatus.status === 'error'
					? 'error'
					: 'degraded';

		return {
			status: overallStatus,
			service: 'mana-crawler',
			version: '1.0.0',
			timestamp: new Date().toISOString(),
			components: {
				redis: redisStatus,
				database: dbStatus,
			},
		};
	}
}
