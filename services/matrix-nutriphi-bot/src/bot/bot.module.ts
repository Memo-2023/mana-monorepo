import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { NutriPhiModule } from '../nutriphi/nutriphi.module';
import { SessionModule, TranscriptionModule } from '@manacore/bot-services';

@Module({
	imports: [NutriPhiModule, SessionModule.forRoot(), TranscriptionModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
