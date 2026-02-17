import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MorningSummaryScheduler } from './morning-summary.scheduler';
import { BotModule } from '../bot/bot.module';
import { SessionModule } from '@manacore/bot-services';

/**
 * Scheduler Module
 *
 * Provides scheduled tasks for the bot including:
 * - Morning summary delivery
 * - Future: Reminder notifications, recurring tasks, etc.
 */
@Module({
	imports: [ScheduleModule.forRoot(), forwardRef(() => BotModule), SessionModule.forRoot()],
	providers: [MorningSummaryScheduler],
	exports: [MorningSummaryScheduler],
})
export class SchedulerModule {}
