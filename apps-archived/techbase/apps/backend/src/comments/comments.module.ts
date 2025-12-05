import { Module } from '@nestjs/common';
import { CommentsController, AdminCommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
	controllers: [CommentsController, AdminCommentsController],
	providers: [CommentsService],
	exports: [CommentsService],
})
export class CommentsModule {}
