import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { LocationService } from './location.service';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';

@Controller('api/v1/locations')
@UseGuards(JwtAuthGuard)
export class LocationController {
	constructor(private readonly locationService: LocationService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.locationService.findAll(user.userId);
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.locationService.findOne(user.userId, id);
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateLocationDto) {
		return this.locationService.create(user.userId, dto);
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateLocationDto
	) {
		return this.locationService.update(user.userId, id, dto);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.locationService.delete(user.userId, id);
	}
}
