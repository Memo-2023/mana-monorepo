import { Module } from '@nestjs/common';
import { GenerationService } from './generation.service';
import { GeminiService } from './gemini.service';
import { ImageProcessingService } from './image-processing.service';
import { StorageModule } from '../storage/storage.module';

@Module({
	imports: [StorageModule],
	providers: [GenerationService, GeminiService, ImageProcessingService],
	exports: [GenerationService],
})
export class GenerationModule {}
