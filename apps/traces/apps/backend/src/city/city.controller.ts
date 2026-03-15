import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@manacore/shared-nestjs-auth';
import type { CurrentUserData } from '@manacore/shared-nestjs-auth';
import { CityService } from './city.service';

@Controller('cities')
@UseGuards(JwtAuthGuard)
export class CityController {
	constructor(private readonly cityService: CityService) {}

	@Get()
	async getCities(@CurrentUser() user: CurrentUserData) {
		return this.cityService.getUserCities(user.userId);
	}

	@Get(':id')
	async getCityDetail(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.cityService.getCityDetail(user.userId, id);
	}
}
