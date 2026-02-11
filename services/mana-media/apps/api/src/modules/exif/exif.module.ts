import { Module } from '@nestjs/common';
import { ExifService } from './exif.service';

@Module({
	providers: [ExifService],
	exports: [ExifService],
})
export class ExifModule {}
