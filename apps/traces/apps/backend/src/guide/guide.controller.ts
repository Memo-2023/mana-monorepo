import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@manacore/shared-nestjs-auth';
import type { CurrentUserData } from '@manacore/shared-nestjs-auth';
import { GuideService } from './guide.service';
import type { GenerateGuideRequest } from '@traces/types';

@Controller('guides')
@UseGuards(JwtAuthGuard)
export class GuideController {
	constructor(private readonly guideService: GuideService) {}

	@Post('generate')
	async generateGuide(@CurrentUser() user: CurrentUserData, @Body() body: GenerateGuideRequest) {
		return this.guideService.generateGuide(user.userId, body);
	}

	@Get()
	async getGuides(@CurrentUser() user: CurrentUserData) {
		return this.guideService.getUserGuides(user.userId);
	}

	@Get(':id')
	async getGuideDetail(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.guideService.getGuideDetail(user.userId, id);
	}

	@Delete(':id')
	async deleteGuide(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.guideService.deleteGuide(user.userId, id);
	}
}
