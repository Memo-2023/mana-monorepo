import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { WateringService } from './watering.service';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

class LogWateringDto {
	@IsOptional()
	@IsString()
	notes?: string;
}

class UpdateScheduleDto {
	@IsNumber()
	@Min(1)
	frequencyDays: number;
}

@Controller('watering')
@UseGuards(JwtAuthGuard)
export class WateringController {
	constructor(private readonly wateringService: WateringService) {}

	@Get('upcoming')
	async getUpcoming(@CurrentUser() user: CurrentUserData) {
		return this.wateringService.getUpcoming(user.userId);
	}

	@Post(':plantId/water')
	async logWatering(
		@Param('plantId') plantId: string,
		@CurrentUser() user: CurrentUserData,
		@Body() dto: LogWateringDto
	) {
		return this.wateringService.logWatering(plantId, user.userId, dto.notes);
	}

	@Put(':plantId')
	async updateSchedule(
		@Param('plantId') plantId: string,
		@CurrentUser() user: CurrentUserData,
		@Body() dto: UpdateScheduleDto
	) {
		return this.wateringService.updateSchedule(plantId, user.userId, dto.frequencyDays);
	}

	@Get(':plantId/history')
	async getHistory(@Param('plantId') plantId: string, @CurrentUser() user: CurrentUserData) {
		return this.wateringService.getWateringHistory(plantId, user.userId);
	}
}
