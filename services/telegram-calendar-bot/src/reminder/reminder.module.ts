import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReminderScheduler } from './reminder.scheduler';
import { ReminderService } from './reminder.service';
import { CalendarModule } from '../calendar/calendar.module';
import { UserModule } from '../user/user.module';

@Module({
	imports: [ScheduleModule.forRoot(), CalendarModule, UserModule],
	providers: [ReminderScheduler, ReminderService],
	exports: [ReminderService],
})
export class ReminderModule {}
