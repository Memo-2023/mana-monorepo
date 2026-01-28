import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportScheduler } from './report.scheduler';
import { BotModule } from '../bot/bot.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
	imports: [ScheduleModule.forRoot(), BotModule, AnalyticsModule],
	providers: [ReportScheduler],
})
export class SchedulerModule {}
