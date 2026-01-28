import { Controller, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { SourceService } from './source.service';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('sources')
@UseGuards(JwtAuthGuard)
export class SourceController {
	constructor(private readonly sourceService: SourceService) {}

	@Get('research/:researchResultId')
	async findByResearchResult(
		@CurrentUser() user: CurrentUserData,
		@Param('researchResultId', ParseUUIDPipe) researchResultId: string,
	) {
		return this.sourceService.findByResearchResult(user.userId, researchResultId);
	}

	@Get('question/:questionId')
	async findByQuestion(
		@CurrentUser() user: CurrentUserData,
		@Param('questionId', ParseUUIDPipe) questionId: string,
	) {
		return this.sourceService.findByQuestion(user.userId, questionId);
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.sourceService.findOne(user.userId, id);
	}

	@Get(':id/content')
	async getContent(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		return this.sourceService.getContent(user.userId, id);
	}
}
