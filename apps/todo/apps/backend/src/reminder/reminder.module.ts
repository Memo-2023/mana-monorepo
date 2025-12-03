import { Module } from '@nestjs/common';
import { ReminderController } from './reminder.controller';
import { ReminderService } from './reminder.service';
import { TaskModule } from '../task/task.module';

@Module({
	imports: [TaskModule],
	controllers: [ReminderController],
	providers: [ReminderService],
	exports: [ReminderService],
})
export class ReminderModule {}
