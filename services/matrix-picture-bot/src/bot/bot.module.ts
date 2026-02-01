import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { PictureModule } from '../picture/picture.module';
import { SessionModule, TranscriptionModule, CreditModule } from '@manacore/bot-services';

@Module({
	imports: [
		PictureModule,
		SessionModule.forRoot(),
		TranscriptionModule.register({
			sttUrl: process.env.STT_URL || 'http://localhost:3020',
		}),
		CreditModule.forRoot(),
	],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
