import { Module } from '@nestjs/common';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';
import { FavoriteModule } from '../favorite/favorite.module';
import { TagModule } from '../tag/tag.module';

@Module({
	imports: [FavoriteModule, TagModule],
	controllers: [PhotoController],
	providers: [PhotoService],
	exports: [PhotoService],
})
export class PhotoModule {}
