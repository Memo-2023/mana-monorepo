import { Module } from '@nestjs/common';
import { EventTagGroupController } from './event-tag-group.controller';
import { EventTagGroupService } from './event-tag-group.service';

@Module({
	controllers: [EventTagGroupController],
	providers: [EventTagGroupService],
	exports: [EventTagGroupService],
})
export class EventTagGroupModule {}
