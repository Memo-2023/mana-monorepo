import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
	constructor(private readonly settingsService: SettingsService) {}

	@Get()
	get(@CurrentUser() user: CurrentUserData) {
		return this.settingsService.get(user.userId);
	}

	@Put()
	update(@CurrentUser() user: CurrentUserData, @Body() dto: UpdateSettingsDto) {
		return this.settingsService.update(user.userId, dto);
	}
}
