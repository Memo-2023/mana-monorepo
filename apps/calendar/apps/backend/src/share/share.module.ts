import { Module } from '@nestjs/common';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
	imports: [CalendarModule],
	controllers: [ShareController],
	providers: [ShareService],
	exports: [ShareService],
})
export class ShareModule {}
