import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
	SessionService,
	MorningSummaryService,
	MorningPreferencesService,
} from '@manacore/bot-services';
import { MatrixService } from '../bot/matrix.service';

/**
 * Morning Summary Scheduler
 *
 * Runs every minute and checks if any users should receive their morning summary.
 * Matches the current time against each user's configured delivery time and timezone.
 */
@Injectable()
export class MorningSummaryScheduler implements OnModuleInit {
	private readonly logger = new Logger(MorningSummaryScheduler.name);

	// Track which users have received their summary today to avoid duplicates
	private deliveredToday: Map<string, string> = new Map(); // userId -> date

	constructor(
		private sessionService: SessionService,
		private morningSummaryService: MorningSummaryService,
		private preferencesService: MorningPreferencesService,
		private matrixService: MatrixService
	) {}

	onModuleInit() {
		this.logger.log('Morning Summary Scheduler initialized');
	}

	/**
	 * Check delivery times every minute
	 */
	@Cron(CronExpression.EVERY_MINUTE)
	async checkDeliveryTimes() {
		const now = new Date();
		const todayStr = now.toISOString().split('T')[0];

		// Get all active users with sessions
		const activeUsers = this.sessionService.getActiveUserIds();

		for (const userId of activeUsers) {
			// Skip if already delivered today
			if (this.deliveredToday.get(userId) === todayStr) {
				continue;
			}

			try {
				const prefs = await this.preferencesService.getPreferences(userId);

				// Skip if not enabled
				if (!prefs.enabled) {
					continue;
				}

				// Check if it's time to deliver
				if (this.preferencesService.shouldDeliverNow(prefs, now)) {
					await this.deliverSummary(userId);
					this.deliveredToday.set(userId, todayStr);
				}
			} catch (error) {
				this.logger.error(`Error checking delivery for ${userId}:`, error);
			}
		}
	}

	/**
	 * Clean up delivered tracking at midnight (UTC)
	 */
	@Cron('0 0 * * *', { timeZone: 'UTC' })
	cleanupDeliveredTracking() {
		this.deliveredToday.clear();
		this.logger.debug('Cleared delivered tracking for new day');
	}

	/**
	 * Deliver morning summary to a user
	 */
	private async deliverSummary(matrixUserId: string): Promise<void> {
		const token = await this.sessionService.getToken(matrixUserId);
		if (!token) {
			this.logger.warn(`Cannot deliver summary to ${matrixUserId}: no token`);
			return;
		}

		try {
			const prefs = await this.preferencesService.getPreferences(matrixUserId);
			const summary = await this.morningSummaryService.generateSummary(matrixUserId, token);
			const formatted = this.morningSummaryService.formatSummary(summary, prefs.format);

			// Send via Matrix
			await this.matrixService.sendDirectMessage(matrixUserId, formatted);

			this.logger.log(`Delivered morning summary to ${matrixUserId}`);
		} catch (error) {
			this.logger.error(`Failed to deliver summary to ${matrixUserId}:`, error);
		}
	}
}
