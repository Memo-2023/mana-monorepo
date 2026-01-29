import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { apiKeys } from '../db/schema';

@Injectable()
export class SchedulerService {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly db: ReturnType<typeof import('../db/connection').getDb>
	) {}

	/**
	 * Reset monthly credits on the 1st of each month at 00:00 UTC
	 */
	@Cron('0 0 1 * *')
	async resetMonthlyCredits() {
		console.log('[Scheduler] Running monthly credit reset...');

		try {
			const result = await this.db
				.update(apiKeys)
				.set({
					creditsUsed: 0,
					creditsResetAt: this.getNextMonthReset(),
					updatedAt: new Date(),
				})
				.returning({ id: apiKeys.id });

			console.log(`[Scheduler] Reset credits for ${result.length} API keys`);
		} catch (error) {
			console.error('[Scheduler] Failed to reset monthly credits:', error);
		}
	}

	/**
	 * Clean up old usage logs (older than 90 days) - runs weekly
	 */
	@Cron(CronExpression.EVERY_WEEK)
	async cleanupOldUsageLogs() {
		console.log('[Scheduler] Cleaning up old usage logs...');

		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - 90);

			await this.db.execute(
				sql`DELETE FROM api_gateway.api_usage WHERE created_at < ${cutoffDate.toISOString()}`
			);

			console.log('[Scheduler] Cleaned up usage logs older than 90 days');
		} catch (error) {
			console.error('[Scheduler] Failed to cleanup usage logs:', error);
		}
	}

	/**
	 * Aggregate daily usage stats - runs at 1:00 AM UTC
	 */
	@Cron('0 1 * * *')
	async aggregateDailyUsage() {
		console.log('[Scheduler] Daily usage aggregation completed (handled by interceptor)');
		// Note: Daily aggregation is already handled in real-time by UsageTrackingInterceptor
		// This cron is a placeholder for any additional daily processing
	}

	private getNextMonthReset(): Date {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth() + 1, 1);
	}
}
