import { Module } from '@nestjs/common';
import { CalendarClient } from './calendar.client';

@Module({
	providers: [CalendarClient],
	exports: [CalendarClient],
})
export class CalendarModule {}
