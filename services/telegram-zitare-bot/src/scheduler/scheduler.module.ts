import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DailyScheduler } from './daily.scheduler';
import { QuotesModule } from '../quotes/quotes.module';
import { UserModule } from '../user/user.module';

@Module({
	imports: [ScheduleModule.forRoot(), QuotesModule, UserModule],
	providers: [DailyScheduler],
})
export class SchedulerModule {}
