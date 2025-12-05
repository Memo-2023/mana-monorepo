import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';

@Module({
	imports: [
		MulterModule.register({
			limits: { fileSize: 10 * 1024 * 1024 },
		}),
	],
	controllers: [PhotoController],
	providers: [PhotoService],
	exports: [PhotoService],
})
export class PhotoModule {}
