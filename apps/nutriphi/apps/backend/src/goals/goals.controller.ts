import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { GoalsService } from './goals.service';
import { IsNumber, IsOptional, Min } from 'class-validator';

class SetGoalsDto {
	@IsNumber()
	@Min(500)
	dailyCalories!: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	dailyProtein?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	dailyCarbs?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	dailyFat?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	dailyFiber?: number;
}

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
	constructor(private readonly goalsService: GoalsService) {}

	@Get()
	async getGoals(@CurrentUser() user: CurrentUserData) {
		return this.goalsService.getGoals(user.userId);
	}

	@Post()
	async setGoals(@CurrentUser() user: CurrentUserData, @Body() dto: SetGoalsDto) {
		return this.goalsService.createOrUpdate(user.userId, dto);
	}

	@Delete()
	async deleteGoals(@CurrentUser() user: CurrentUserData) {
		return this.goalsService.delete(user.userId);
	}
}
