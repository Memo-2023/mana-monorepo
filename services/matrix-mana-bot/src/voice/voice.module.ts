import { Module } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { VoiceFormatterService } from './voice-formatter.service';

@Module({
	providers: [VoiceService, VoiceFormatterService],
	exports: [VoiceService, VoiceFormatterService],
})
export class VoiceModule {}
