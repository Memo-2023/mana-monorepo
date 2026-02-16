import { Module, forwardRef } from '@nestjs/common';
import { BeatController } from './beat.controller';
import { BeatService } from './beat.service';
import { SttModule } from '../stt/stt.module';
import { LyricsModule } from '../lyrics/lyrics.module';

@Module({
	imports: [SttModule, forwardRef(() => LyricsModule)],
	controllers: [BeatController],
	providers: [BeatService],
	exports: [BeatService],
})
export class BeatModule {}
