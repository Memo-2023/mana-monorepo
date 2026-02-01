import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ManadeckModule } from '../manadeck/manadeck.module';
import { SessionModule, TranscriptionModule } from '@manacore/bot-services';

@Module({
	imports: [
		ManadeckModule,
		SessionModule.forRoot(),
		TranscriptionModule.register({
			sttUrl: process.env.STT_URL || 'http://localhost:3020',
		}),
	],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
