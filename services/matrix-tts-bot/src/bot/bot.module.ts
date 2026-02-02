import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { TtsModule } from '../tts/tts.module';
import { TranscriptionModule, SessionModule, CreditModule } from '@manacore/bot-services';

@Module({
	imports: [
		TtsModule,
		TranscriptionModule.register({
			sttUrl: process.env.STT_URL || 'http://localhost:3020',
		}),
		SessionModule.forRoot({ storageMode: 'redis' }),
		CreditModule.forRoot(),
	],
	providers: [MatrixService],
})
export class BotModule {}
