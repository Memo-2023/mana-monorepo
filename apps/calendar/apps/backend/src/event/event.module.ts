import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { CalendarModule } from '../calendar/calendar.module';
import { EventTagModule } from '../event-tag/event-tag.module';

@Module({
	imports: [CalendarModule, EventTagModule],
	controllers: [EventController],
	providers: [EventService],
	exports: [EventService],
})
export class EventModule {}
