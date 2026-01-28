import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { StorageService } from './storage.service';
import { TranscriptionModule } from '../transcription/transcription.module';

@Module({
	imports: [TranscriptionModule],
	providers: [MediaService, StorageService],
	exports: [MediaService, StorageService],
})
export class MediaModule {}
