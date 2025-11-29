import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	Headers,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { CreateFeedbackDto, FeedbackQueryDto } from './dto';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
	constructor(private readonly feedbackService: FeedbackService) {}

	@Post()
	async createFeedback(
		@CurrentUser() user: CurrentUserData,
		@Body() dto: CreateFeedbackDto,
		@Headers('x-app-id') appIdHeader?: string
	) {
		const appId = appIdHeader || 'unknown';
		return this.feedbackService.createFeedback(user.userId, appId, dto);
	}

	@Get('public')
	async getPublicFeedback(@CurrentUser() user: CurrentUserData, @Query() query: FeedbackQueryDto) {
		return this.feedbackService.getPublicFeedback(user.userId, query);
	}

	@Get('my')
	async getMyFeedback(
		@CurrentUser() user: CurrentUserData,
		@Query('appId') appId?: string
	) {
		return this.feedbackService.getMyFeedback(user.userId, appId);
	}

	@Post(':id/vote')
	async vote(@CurrentUser() user: CurrentUserData, @Param('id') feedbackId: string) {
		return this.feedbackService.vote(user.userId, feedbackId);
	}

	@Delete(':id/vote')
	async unvote(@CurrentUser() user: CurrentUserData, @Param('id') feedbackId: string) {
		return this.feedbackService.unvote(user.userId, feedbackId);
	}
}
