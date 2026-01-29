import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { TtsModule } from '../tts/tts.module';

@Module({
	imports: [TtsModule],
	providers: [MatrixService],
})
export class BotModule {}
