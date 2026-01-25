import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { StatsService } from './stats.service';
import { IsOptional, IsDateString } from 'class-validator';

class StatsQueryDto {
	@IsOptional()
	@IsDateString()
	date?: string;
}

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
	constructor(private readonly statsService: StatsService) {}

	@Get('daily')
	async getDailySummary(@CurrentUser() user: CurrentUserData, @Query() query: StatsQueryDto) {
		const date = query.date ? new Date(query.date) : new Date();
		return this.statsService.getDailySummary(user.userId, date);
	}

	@Get('weekly')
	async getWeeklyStats(@CurrentUser() user: CurrentUserData, @Query() query: StatsQueryDto) {
		const endDate = query.date ? new Date(query.date) : new Date();
		return this.statsService.getWeeklyStats(user.userId, endDate);
	}
}
