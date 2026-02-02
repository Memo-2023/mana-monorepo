import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ClockModule } from '../clock/clock.module';
import {
	TranscriptionModule,
	SessionModule,
	CreditModule,
	I18nModule,
} from '@manacore/bot-services';

@Module({
	imports: [
		ClockModule,
		TranscriptionModule.forRoot(),
		SessionModule.forRoot(),
		CreditModule.forRoot(),
		I18nModule.forRoot(),
	],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
