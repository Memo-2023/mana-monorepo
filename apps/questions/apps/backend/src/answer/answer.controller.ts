import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { AnswerService } from './answer.service';
import { CreateAnswerDto, UpdateAnswerDto, RateAnswerDto, AcceptAnswerDto } from './dto';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('answers')
@UseGuards(JwtAuthGuard)
export class AnswerController {
	constructor(private readonly answerService: AnswerService) {}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateAnswerDto) {
		return this.answerService.create(user.userId, dto);
	}

	@Get('question/:questionId')
	async findByQuestion(
		@CurrentUser() user: CurrentUserData,
		@Param('questionId', ParseUUIDPipe) questionId: string,
	) {
		return this.answerService.findByQuestion(user.userId, questionId);
	}

	@Get('question/:questionId/accepted')
	async getAccepted(
		@CurrentUser() user: CurrentUserData,
		@Param('questionId', ParseUUIDPipe) questionId: string,
	) {
		return this.answerService.getAccepted(user.userId, questionId);
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.answerService.findOne(user.userId, id);
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateAnswerDto,
	) {
		return this.answerService.update(user.userId, id, dto);
	}

	@Post(':id/rate')
	async rate(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: RateAnswerDto,
	) {
		return this.answerService.rate(user.userId, id, dto);
	}

	@Post(':id/accept')
	async setAccepted(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: AcceptAnswerDto,
	) {
		return this.answerService.setAccepted(user.userId, id, dto);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.answerService.delete(user.userId, id);
		return { success: true };
	}
}
