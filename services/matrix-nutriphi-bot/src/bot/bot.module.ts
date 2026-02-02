import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { NutriPhiModule } from '../nutriphi/nutriphi.module';
import { SessionModule, TranscriptionModule, CreditModule } from '@manacore/bot-services';

@Module({
	imports: [
		NutriPhiModule,
		SessionModule.forRoot({ storageMode: 'redis' }),
		TranscriptionModule.forRoot(),
		CreditModule.forRoot(),
	],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
