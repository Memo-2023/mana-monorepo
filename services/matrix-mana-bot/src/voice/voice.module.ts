import { Module } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { VoiceFormatterService } from './voice-formatter.service';
import { VoicePreferencesStore } from './voice-preferences.store';

@Module({
	providers: [VoicePreferencesStore, VoiceService, VoiceFormatterService],
	exports: [VoiceService, VoiceFormatterService, VoicePreferencesStore],
})
export class VoiceModule {}
