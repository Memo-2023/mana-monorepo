import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

@Module({
	controllers: [FeedbackController],
	providers: [FeedbackService, JwtAuthGuard, OptionalAuthGuard],
	exports: [FeedbackService],
})
export class FeedbackModule {}
