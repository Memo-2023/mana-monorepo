import { Controller, Get, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

@Controller('health')
export class HealthController {
	constructor(
		@Inject('DATABASE_CONNECTION')
		private readonly db: NodePgDatabase,
	) {}

	@Get()
	async check() {
		const checks = {
			database: await this.checkDatabase(),
			timestamp: new Date().toISOString(),
		};

		const healthy = Object.values(checks).every((v) => v === true || typeof v === 'string');

		return {
			status: healthy ? 'healthy' : 'unhealthy',
			checks,
		};
	}

	@Get('live')
	liveness() {
		return { status: 'ok' };
	}

	@Get('ready')
	async readiness() {
		const dbOk = await this.checkDatabase();
		return {
			status: dbOk ? 'ready' : 'not_ready',
			database: dbOk,
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
