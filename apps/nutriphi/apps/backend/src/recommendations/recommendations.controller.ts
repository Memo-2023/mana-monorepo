import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { RecommendationsService } from './recommendations.service';
import { IsOptional, IsDateString } from 'class-validator';

class QueryDto {
	@IsOptional()
	@IsDateString()
	date?: string;
}

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
	constructor(private readonly recommendationsService: RecommendationsService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData, @Query() query: QueryDto) {
		const date = query.date ? new Date(query.date) : new Date();
		return this.recommendationsService.findByDate(user.userId, date);
	}

	@Post(':id/dismiss')
	async dismiss(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.recommendationsService.dismiss(user.userId, id);
	}
}
