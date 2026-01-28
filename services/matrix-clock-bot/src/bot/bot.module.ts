import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ClockModule } from '../clock/clock.module';
import { TranscriptionModule } from '../transcription/transcription.module';

@Module({
	imports: [ClockModule, TranscriptionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
