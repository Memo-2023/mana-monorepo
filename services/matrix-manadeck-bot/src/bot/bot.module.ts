import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ManadeckModule } from '../manadeck/manadeck.module';
import { SessionModule, TranscriptionModule, CreditModule } from '@manacore/bot-services';

@Module({
	imports: [
		ManadeckModule,
		SessionModule.forRoot({ storageMode: 'redis' }),
		TranscriptionModule.register({
			sttUrl: process.env.STT_URL || 'http://localhost:3020',
		}),
		CreditModule.forRoot(),
	],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
