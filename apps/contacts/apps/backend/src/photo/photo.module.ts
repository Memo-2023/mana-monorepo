import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';
import { DatabaseModule } from '../db/database.module';

@Module({
	imports: [
		DatabaseModule,
		MulterModule.register({
			storage: memoryStorage(),
		}),
	],
	controllers: [PhotoController],
	providers: [PhotoService],
	exports: [PhotoService],
})
export class PhotoModule {}
