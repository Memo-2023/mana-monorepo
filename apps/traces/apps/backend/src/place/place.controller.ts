import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@manacore/shared-nestjs-auth';
import type { CurrentUserData } from '@manacore/shared-nestjs-auth';
import { PlaceService } from './place.service';
import type { CreatePlaceRequest, UpdatePlaceRequest } from '@traces/types';

@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlaceController {
	constructor(private readonly placeService: PlaceService) {}

	@Get()
	async getPlaces(@CurrentUser() user: CurrentUserData) {
		return this.placeService.getUserPlaces(user.userId);
	}

	@Post()
	async createPlace(@CurrentUser() user: CurrentUserData, @Body() body: CreatePlaceRequest) {
		return this.placeService.createPlace(user.userId, body);
	}

	@Put(':id')
	async updatePlace(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() body: UpdatePlaceRequest
	) {
		return this.placeService.updatePlace(user.userId, id, body);
	}

	@Delete(':id')
	async deletePlace(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.placeService.deletePlace(user.userId, id);
	}
}
