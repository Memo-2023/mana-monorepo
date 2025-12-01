import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import {
	UpdateProfileDto,
	ProfileResponse,
	UserStatsResponse,
	RateLimitsResponse,
} from './dto/profile.dto';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfileController {
	constructor(private readonly profileService: ProfileService) {}

	@Get('me')
	async getMyProfile(@CurrentUser() user: CurrentUserData): Promise<ProfileResponse> {
		// Get or create profile (ensures profile exists)
		return this.profileService.getOrCreateProfile(user.userId, user.email);
	}

	@Patch('me')
	async updateMyProfile(
		@CurrentUser() user: CurrentUserData,
		@Body() dto: UpdateProfileDto
	): Promise<ProfileResponse> {
		return this.profileService.updateProfile(user.userId, dto);
	}

	@Get('stats')
	async getMyStats(@CurrentUser() user: CurrentUserData): Promise<UserStatsResponse> {
		return this.profileService.getUserStats(user.userId);
	}

	@Get('rate-limits')
	async getRateLimits(@CurrentUser() user: CurrentUserData): Promise<RateLimitsResponse> {
		return this.profileService.getRateLimits(user.userId);
	}
}
