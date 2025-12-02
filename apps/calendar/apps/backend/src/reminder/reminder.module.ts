import { Module } from '@nestjs/common';
import { ReminderController } from './reminder.controller';
import { ReminderService } from './reminder.service';
import { EventModule } from '../event/event.module';

@Module({
	imports: [EventModule],
	controllers: [ReminderController],
	providers: [ReminderService],
	exports: [ReminderService],
})
export class ReminderModule {}
