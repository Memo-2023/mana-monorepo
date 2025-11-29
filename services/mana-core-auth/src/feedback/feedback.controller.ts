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
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { CreateFeedbackDto, FeedbackQueryDto } from './dto';

@Controller('feedback')
export class FeedbackController {
	constructor(private readonly feedbackService: FeedbackService) {}

	@Post()
	@UseGuards(JwtAuthGuard)
	async createFeedback(
		@CurrentUser() user: CurrentUserData,
		@Body() dto: CreateFeedbackDto,
		@Headers('x-app-id') appIdHeader?: string
	) {
		const appId = appIdHeader || 'unknown';
		return this.feedbackService.createFeedback(user.userId, appId, dto);
	}

	@Get('public')
	@UseGuards(OptionalAuthGuard)
	async getPublicFeedback(
		@CurrentUser() user: CurrentUserData | null,
		@Query() query: FeedbackQueryDto
	) {
		return this.feedbackService.getPublicFeedback(user?.userId || null, query);
	}

	@Get('my')
	@UseGuards(JwtAuthGuard)
	async getMyFeedback(
		@CurrentUser() user: CurrentUserData,
		@Query('appId') appId?: string
	) {
		return this.feedbackService.getMyFeedback(user.userId, appId);
	}

	@Post(':id/vote')
	@UseGuards(JwtAuthGuard)
	async vote(@CurrentUser() user: CurrentUserData, @Param('id') feedbackId: string) {
		return this.feedbackService.vote(user.userId, feedbackId);
	}

	@Delete(':id/vote')
	@UseGuards(JwtAuthGuard)
	async unvote(@CurrentUser() user: CurrentUserData, @Param('id') feedbackId: string) {
		return this.feedbackService.unvote(user.userId, feedbackId);
	}
}
