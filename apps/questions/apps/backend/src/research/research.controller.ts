import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ResearchService } from './research.service';
import { ManaSearchClient } from './mana-search.client';
import { StartResearchDto } from './dto';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('research')
@UseGuards(JwtAuthGuard)
export class ResearchController {
	constructor(
		private readonly researchService: ResearchService,
		private readonly manaSearchClient: ManaSearchClient,
	) {}

	@Post('start')
	async startResearch(@CurrentUser() user: CurrentUserData, @Body() dto: StartResearchDto) {
		return this.researchService.startResearch(user.userId, dto);
	}

	@Get('question/:questionId')
	async getResearchResults(
		@CurrentUser() user: CurrentUserData,
		@Param('questionId', ParseUUIDPipe) questionId: string,
	) {
		return this.researchService.getResearchResults(user.userId, questionId);
	}

	@Get(':id')
	async getResearchResult(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
	) {
		return this.researchService.getResearchResult(user.userId, id);
	}

	@Get('health/search')
	async checkSearchHealth() {
		const healthy = await this.manaSearchClient.healthCheck();
		return {
			service: 'mana-search',
			status: healthy ? 'healthy' : 'unhealthy',
		};
	}
}
