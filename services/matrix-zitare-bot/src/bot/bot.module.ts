import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { QuotesModule } from '../quotes/quotes.module';
import { SessionModule } from '../session/session.module';
import { TranscriptionModule } from '../transcription/transcription.module';

@Module({
	imports: [QuotesModule, SessionModule, TranscriptionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
