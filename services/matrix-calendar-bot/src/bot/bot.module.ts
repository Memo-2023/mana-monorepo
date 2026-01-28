import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
	imports: [CalendarModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
