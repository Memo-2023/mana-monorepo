import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';
import { StorageService } from './storage.service';

@Module({
	imports: [
		MulterModule.register({
			limits: {
				fileSize: 10 * 1024 * 1024, // 10MB
			},
		}),
	],
	controllers: [PhotoController],
	providers: [PhotoService, StorageService],
	exports: [PhotoService, StorageService],
})
export class PhotoModule {}
