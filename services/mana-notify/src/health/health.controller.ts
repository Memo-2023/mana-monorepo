import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DATABASE_CONNECTION } from '../db/database.module';
import { sql } from 'drizzle-orm';

interface HealthStatus {
	status: 'healthy' | 'unhealthy';
	version: string;
	timestamp: string;
	services: {
		database: boolean;
		redis: boolean;
	};
}

@Controller()
export class HealthController {
	constructor(
		private readonly configService: ConfigService,
		@Inject(DATABASE_CONNECTION) private readonly db: any
	) {}

	@Get('/health')
	async getHealth(): Promise<HealthStatus> {
		const dbHealthy = await this.checkDatabase();

		return {
			status: dbHealthy ? 'healthy' : 'unhealthy',
			version: '1.0.0',
			timestamp: new Date().toISOString(),
			services: {
				database: dbHealthy,
				redis: true, // BullMQ manages Redis connection
			},
		};
	}

	private async checkDatabase(): Promise<boolean> {
		try {
			await this.db.execute(sql`SELECT 1`);
			return true;
		} catch {
			return false;
		}
	}
}
