import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { CalendarModule } from '../calendar/calendar.module';
import { TranscriptionModule, SessionModule, CreditModule } from '@manacore/bot-services';

@Module({
	imports: [
		CalendarModule,
		TranscriptionModule.register({
			sttUrl: process.env.STT_URL || 'http://localhost:3020',
		}),
		SessionModule.forRoot(),
		CreditModule.forRoot(),
	],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
