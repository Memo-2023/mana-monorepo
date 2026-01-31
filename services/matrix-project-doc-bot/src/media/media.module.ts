import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { StorageService } from './storage.service';
import { TranscriptionModule } from '@manacore/bot-services';

@Module({
	imports: [TranscriptionModule.forRoot()],
	providers: [MediaService, StorageService],
	exports: [MediaService, StorageService],
})
export class MediaModule {}
