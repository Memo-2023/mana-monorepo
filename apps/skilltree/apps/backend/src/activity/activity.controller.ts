import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ActivityService } from './activity.service';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivityController {
	constructor(private readonly activityService: ActivityService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData, @Query('limit') limit?: number) {
		const activities = await this.activityService.findAll(user.userId, limit ?? 50);
		return { activities };
	}

	@Get('recent')
	async getRecent(@CurrentUser() user: CurrentUserData, @Query('limit') limit?: number) {
		const activities = await this.activityService.getRecent(user.userId, limit ?? 10);
		return { activities };
	}

	@Get('skill/:skillId')
	async findBySkill(@CurrentUser() user: CurrentUserData, @Param('skillId') skillId: string) {
		const activities = await this.activityService.findBySkill(user.userId, skillId);
		return { activities };
	}
}
