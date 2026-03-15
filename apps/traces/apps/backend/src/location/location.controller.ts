import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@manacore/shared-nestjs-auth';
import type { CurrentUserData } from '@manacore/shared-nestjs-auth';
import { LocationService } from './location.service';
import type { LocationSyncRequest, LocationQueryParams } from '@traces/types';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationController {
	constructor(private readonly locationService: LocationService) {}

	@Post('sync')
	async syncLocations(@CurrentUser() user: CurrentUserData, @Body() body: LocationSyncRequest) {
		return this.locationService.syncLocations(user.userId, body.locations);
	}

	@Get()
	async getLocations(@CurrentUser() user: CurrentUserData, @Query() query: LocationQueryParams) {
		return this.locationService.getLocations(user.userId, query);
	}
}
