import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionController {
	constructor(private readonly questionService: QuestionService) {}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateQuestionDto) {
		return this.questionService.create(user.userId, dto);
	}

	@Get()
	async findAll(
		@CurrentUser() user: CurrentUserData,
		@Query('collectionId') collectionId?: string,
		@Query('status') status?: string,
		@Query('search') search?: string,
		@Query('tags') tags?: string,
		@Query('limit') limit?: string,
		@Query('offset') offset?: string,
	) {
		return this.questionService.findAll(user.userId, {
			collectionId,
			status,
			search,
			tags: tags ? tags.split(',') : undefined,
			limit: limit ? parseInt(limit, 10) : undefined,
			offset: offset ? parseInt(offset, 10) : undefined,
		});
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.questionService.findOne(user.userId, id);
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateQuestionDto,
	) {
		return this.questionService.update(user.userId, id, dto);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.questionService.delete(user.userId, id);
		return { success: true };
	}

	@Put(':id/status')
	async updateStatus(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body('status') status: string,
	) {
		return this.questionService.updateStatus(user.userId, id, status);
	}
}
