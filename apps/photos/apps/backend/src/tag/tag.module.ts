import { Module } from '@nestjs/common';
import { TagController, PhotoTagController } from './tag.controller';
import { TagService } from './tag.service';

@Module({
	controllers: [TagController, PhotoTagController],
	providers: [TagService],
	exports: [TagService],
})
export class TagModule {}
