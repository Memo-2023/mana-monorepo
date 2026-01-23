import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AnalyticsService } from '../analytics/analytics.service';
import { BotService } from '../bot/bot.service';

@Injectable()
export class ReportScheduler {
	private readonly logger = new Logger(ReportScheduler.name);

	constructor(
		private readonly analyticsService: AnalyticsService,
		private readonly botService: BotService
	) {}

	/**
	 * Daily Report - Every day at 9:00 AM Europe/Berlin
	 * Cron: minute hour day month weekday
	 */
	@Cron('0 9 * * *', {
		name: 'daily-report',
		timeZone: 'Europe/Berlin',
	})
	async sendDailyReport(): Promise<void> {
		this.logger.log('Starting daily report...');

		try {
			const report = await this.analyticsService.generateDailyReport();
			await this.botService.sendReport(report);
			this.logger.log('Daily report sent successfully');
		} catch (error) {
			this.logger.error('Failed to send daily report:', error);
		}
	}

	/**
	 * Weekly Report - Every Monday at 9:00 AM Europe/Berlin
	 * Cron: minute hour day month weekday (1 = Monday)
	 */
	@Cron('0 9 * * 1', {
		name: 'weekly-report',
		timeZone: 'Europe/Berlin',
	})
	async sendWeeklyReport(): Promise<void> {
		this.logger.log('Starting weekly report...');

		try {
			const report = await this.analyticsService.generateWeeklyReport();
			await this.botService.sendReport(report);
			this.logger.log('Weekly report sent successfully');
		} catch (error) {
			this.logger.error('Failed to send weekly report:', error);
		}
	}

	/**
	 * Health check log - Every hour
	 * Useful for debugging and ensuring the scheduler is running
	 */
	@Cron('0 * * * *', {
		name: 'scheduler-health',
		timeZone: 'Europe/Berlin',
	})
	healthCheck(): void {
		this.logger.debug('Scheduler health check - running');
	}
}
