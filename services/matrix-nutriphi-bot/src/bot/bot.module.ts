import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { NutriPhiModule } from '../nutriphi/nutriphi.module';
import { SessionModule } from '../session/session.module';
import { TranscriptionModule } from '../transcription/transcription.module';

@Module({
	imports: [NutriPhiModule, SessionModule, TranscriptionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
