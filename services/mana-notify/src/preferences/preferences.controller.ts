import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { PreferencesService, UpdatePreferencesDto } from './preferences.service';
import { JwtAuthGuard, AuthenticatedRequest } from '../common/guards/jwt-auth.guard';
import { Preference } from '../db/schema';
import { IsBoolean, IsOptional, IsString, IsObject, Matches } from 'class-validator';

class UpdatePreferencesRequestDto {
	@IsBoolean()
	@IsOptional()
	emailEnabled?: boolean;

	@IsBoolean()
	@IsOptional()
	pushEnabled?: boolean;

	@IsBoolean()
	@IsOptional()
	quietHoursEnabled?: boolean;

	@IsString()
	@IsOptional()
	@Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
		message: 'quietHoursStart must be in HH:mm format',
	})
	quietHoursStart?: string;

	@IsString()
	@IsOptional()
	@Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
		message: 'quietHoursEnd must be in HH:mm format',
	})
	quietHoursEnd?: string;

	@IsString()
	@IsOptional()
	timezone?: string;

	@IsObject()
	@IsOptional()
	categoryPreferences?: Record<string, Record<string, boolean>>;
}

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
	constructor(private readonly preferencesService: PreferencesService) {}

	@Get()
	async getPreferences(@Req() req: AuthenticatedRequest): Promise<{ preferences: Preference }> {
		const prefs = await this.preferencesService.getOrCreate(req.user.userId);
		return { preferences: prefs };
	}

	@Put()
	async updatePreferences(
		@Req() req: AuthenticatedRequest,
		@Body() dto: UpdatePreferencesRequestDto
	): Promise<{ preferences: Preference }> {
		const prefs = await this.preferencesService.update(req.user.userId, dto);
		return { preferences: prefs };
	}
}
