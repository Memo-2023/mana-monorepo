import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReminderScheduler } from './reminder.scheduler';
import { TodoClientModule } from '../todo-client/todo-client.module';
import { UserModule } from '../user/user.module';

@Module({
	imports: [ScheduleModule.forRoot(), TodoClientModule, UserModule],
	providers: [ReminderScheduler],
})
export class SchedulerModule {}
