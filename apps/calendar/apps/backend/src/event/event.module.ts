import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
	imports: [CalendarModule],
	controllers: [EventController],
	providers: [EventService],
	exports: [EventService],
})
export class EventModule {}
