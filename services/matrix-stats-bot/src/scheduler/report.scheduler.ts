import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatrixService } from '../bot/matrix.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class ReportScheduler {
	private readonly logger = new Logger(ReportScheduler.name);

	constructor(
		private readonly matrixService: MatrixService,
		private readonly analyticsService: AnalyticsService
	) {}

	// Daily report at 9:00 AM Berlin time
	@Cron('0 9 * * *', { timeZone: 'Europe/Berlin' })
	async sendDailyReport() {
		this.logger.log('Sending daily report...');
		const report = await this.analyticsService.generateDailyReport();
		await this.matrixService.sendScheduledReport(`📅 **Täglicher Report**\n\n${report}`);
	}

	// Weekly report on Monday at 9:00 AM Berlin time
	@Cron('0 9 * * 1', { timeZone: 'Europe/Berlin' })
	async sendWeeklyReport() {
		this.logger.log('Sending weekly report...');
		const report = await this.analyticsService.generateWeeklyReport();
		await this.matrixService.sendScheduledReport(`📅 **Wöchentlicher Report**\n\n${report}`);
	}
}
