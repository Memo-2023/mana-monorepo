import { Module } from '@nestjs/common';
import { TagLinksController } from './tag-links.controller';
import { TagLinksService } from './tag-links.service';

@Module({
	controllers: [TagLinksController],
	providers: [TagLinksService],
	exports: [TagLinksService],
})
export class TagLinksModule {}
