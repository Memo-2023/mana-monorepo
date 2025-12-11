import { Controller, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { UpdateGlobalSettingsDto, UpdateDeviceAppSettingsDto } from './dto';
import type { UpdateAppOverrideDto } from './dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
	constructor(private readonly settingsService: SettingsService) {}

	/**
	 * GET /api/v1/settings
	 * Get all user settings (global + app overrides + device settings)
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

	// ============================================================================
	// Device Settings Endpoints
	// ============================================================================

	/**
	 * GET /api/v1/settings/devices
	 * List all devices for the current user
	 */
	@Get('devices')
	async getDevices(@CurrentUser() user: CurrentUserData) {
		const result = await this.settingsService.getDevices(user.userId);
		return {
			success: true,
			...result,
		};
	}

	/**
	 * GET /api/v1/settings/device/:deviceId/:appId
	 * Get settings for a specific device and app
	 */
	@Get('device/:deviceId/:appId')
	async getDeviceAppSettings(
		@CurrentUser() user: CurrentUserData,
		@Param('deviceId') deviceId: string,
		@Param('appId') appId: string
	) {
		const settings = await this.settingsService.getDeviceAppSettings(user.userId, deviceId, appId);
		return {
			success: true,
			settings,
		};
	}

	/**
	 * PATCH /api/v1/settings/device/:deviceId/:appId
	 * Update settings for a specific device and app
	 */
	@Patch('device/:deviceId/:appId')
	async updateDeviceAppSettings(
		@CurrentUser() user: CurrentUserData,
		@Param('deviceId') deviceId: string,
		@Param('appId') appId: string,
		@Body() dto: UpdateDeviceAppSettingsDto
	) {
		const settings = await this.settingsService.updateDeviceAppSettings(
			user.userId,
			deviceId,
			appId,
			dto
		);
		return {
			success: true,
			...settings,
		};
	}

	/**
	 * DELETE /api/v1/settings/device/:deviceId
	 * Remove a device entirely
	 */
	@Delete('device/:deviceId')
	async removeDevice(@CurrentUser() user: CurrentUserData, @Param('deviceId') deviceId: string) {
		const settings = await this.settingsService.removeDevice(user.userId, deviceId);
		return {
			success: true,
			...settings,
		};
	}

	/**
	 * DELETE /api/v1/settings/device/:deviceId/:appId
	 * Remove app settings from a specific device
	 */
	@Delete('device/:deviceId/:appId')
	async removeDeviceAppSettings(
		@CurrentUser() user: CurrentUserData,
		@Param('deviceId') deviceId: string,
		@Param('appId') appId: string
	) {
		const settings = await this.settingsService.removeDeviceAppSettings(
			user.userId,
			deviceId,
			appId
		);
		return {
			success: true,
			...settings,
		};
	}
}
