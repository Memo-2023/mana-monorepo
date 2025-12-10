import { Module } from '@nestjs/common';
import { EventTagController } from './event-tag.controller';
import { EventTagService } from './event-tag.service';

@Module({
	controllers: [EventTagController],
	providers: [EventTagService],
	exports: [EventTagService],
})
export class EventTagModule {}
