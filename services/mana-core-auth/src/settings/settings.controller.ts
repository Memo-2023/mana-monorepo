import { Controller, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUserData } from '../common/decorators/current-user.decorator';
import { type UpdateGlobalSettingsDto, type UpdateAppOverrideDto } from './dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
	constructor(private readonly settingsService: SettingsService) {}

	/**
	 * GET /api/v1/settings
	 * Get all user settings (global + app overrides)
	 */
	@Get()
	async getSettings(@CurrentUser() user: CurrentUserData) {
		const settings = await this.settingsService.getSettings(user.userId);
		return {
			success: true,
			...settings,
		};
	}

	/**
	 * PATCH /api/v1/settings/global
	 * Update global settings (applies to all apps by default)
	 */
	@Patch('global')
	async updateGlobalSettings(
		@CurrentUser() user: CurrentUserData,
		@Body() dto: UpdateGlobalSettingsDto
	) {
		const settings = await this.settingsService.updateGlobalSettings(user.userId, dto);
		return {
			success: true,
			...settings,
		};
	}

	/**
	 * PATCH /api/v1/settings/app/:appId
	 * Update app-specific override settings
	 */
	@Patch('app/:appId')
	async updateAppOverride(
		@CurrentUser() user: CurrentUserData,
		@Param('appId') appId: string,
		@Body() dto: UpdateAppOverrideDto
	) {
		const settings = await this.settingsService.updateAppOverride(user.userId, appId, dto);
		return {
			success: true,
			...settings,
		};
	}

	/**
	 * DELETE /api/v1/settings/app/:appId
	 * Remove app-specific override (revert to global settings)
	 */
	@Delete('app/:appId')
	async removeAppOverride(@CurrentUser() user: CurrentUserData, @Param('appId') appId: string) {
		const settings = await this.settingsService.removeAppOverride(user.userId, appId);
		return {
			success: true,
			...settings,
		};
	}
}
