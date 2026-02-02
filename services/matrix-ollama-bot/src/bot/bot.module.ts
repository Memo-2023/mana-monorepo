import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { OllamaModule } from '../ollama/ollama.module';
import { TranscriptionModule, SessionModule, CreditModule } from '@manacore/bot-services';

@Module({
	imports: [
		OllamaModule,
		TranscriptionModule.register({
			sttUrl: process.env.STT_URL || 'http://localhost:3020',
		}),
		SessionModule.forRoot({ storageMode: 'redis' }),
		CreditModule.forRoot(),
	],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
