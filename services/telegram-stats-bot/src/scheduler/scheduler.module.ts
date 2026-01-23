import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { BotModule } from '../bot/bot.module';
import { ReportScheduler } from './report.scheduler';

@Module({
	imports: [AnalyticsModule, BotModule],
	providers: [ReportScheduler],
})
export class SchedulerModule {}
