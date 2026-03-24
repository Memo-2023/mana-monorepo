import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { AchievementService } from './achievement.service';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementController {
	constructor(private readonly achievementService: AchievementService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const achievements = await this.achievementService.getAllForUser(user.userId);
		return { achievements };
	}

	@Get('unlocked')
	async findUnlocked(@CurrentUser() user: CurrentUserData) {
		const achievements = await this.achievementService.getUnlockedForUser(user.userId);
		return { achievements };
	}

	@Get('stats')
	async getStats(@CurrentUser() user: CurrentUserData) {
		const stats = await this.achievementService.getStats(user.userId);
		return { stats };
	}
}
