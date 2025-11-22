import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { AuthGuard, CurrentUser } from '@mana-core/nestjs-integration';
import { CreateFeedbackDto, FeedbackQueryDto } from './dto/feedback.dto';
import { JwtPayload } from '../types/jwt-payload.interface';

@Controller('feedback')
@UseGuards(AuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async createFeedback(
    @CurrentUser() user: JwtPayload,
    @Body() createFeedbackDto: CreateFeedbackDto,
  ) {
    return this.feedbackService.createFeedback(user.sub, createFeedbackDto);
  }

  @Get('public')
  async getPublicFeedback(
    @CurrentUser() user: JwtPayload,
    @Query() query: FeedbackQueryDto,
  ) {
    return this.feedbackService.getPublicFeedback(user.sub, query);
  }

  @Get('my')
  async getMyFeedback(@CurrentUser() user: JwtPayload) {
    return this.feedbackService.getMyFeedback(user.sub);
  }

  @Post(':id/vote')
  async voteFeedback(
    @CurrentUser() user: JwtPayload,
    @Param('id') feedbackId: string,
  ) {
    return this.feedbackService.voteFeedback(user.sub, feedbackId);
  }

  @Delete(':id/vote')
  async unvoteFeedback(
    @CurrentUser() user: JwtPayload,
    @Param('id') feedbackId: string,
  ) {
    return this.feedbackService.unvoteFeedback(user.sub, feedbackId);
  }
}
