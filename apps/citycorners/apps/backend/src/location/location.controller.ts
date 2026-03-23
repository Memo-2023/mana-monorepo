import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { LocationService } from './location.service';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class CreateLocationDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsString()
	@IsNotEmpty()
	category!: 'sight' | 'restaurant' | 'shop' | 'museum';

	@IsString()
	@IsNotEmpty()
	description!: string;

	@IsString()
	@IsOptional()
	address?: string;

	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	latitude?: number;

	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	longitude?: number;

	@IsString()
	@IsOptional()
	imageUrl?: string;
}

class UpdateLocationDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsString()
	@IsOptional()
	category?: 'sight' | 'restaurant' | 'shop' | 'museum';

	@IsString()
	@IsOptional()
	description?: string;

	@IsString()
	@IsOptional()
	address?: string;

	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	latitude?: number;

	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	longitude?: number;

	@IsString()
	@IsOptional()
	imageUrl?: string;
}

@Controller('locations')
export class LocationController {
	constructor(private readonly locationService: LocationService) {}

	@Get()
	async findAll(@Query('category') category?: string) {
		const locations = await this.locationService.findAll(category);
		return { locations };
	}

	@Get('search')
	async search(@Query('q') query: string) {
		if (!query || query.trim().length === 0) {
			return { locations: [] };
		}
		const locations = await this.locationService.search(query.trim());
		return { locations };
	}

	@Get(':id')
	async findById(@Param('id') id: string) {
		const location = await this.locationService.findById(id);
		return { location };
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateLocationDto) {
		const location = await this.locationService.create(dto);
		return { location };
	}

	@Put(':id')
	@UseGuards(JwtAuthGuard)
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateLocationDto
	) {
		const location = await this.locationService.update(id, dto);
		return { location };
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.locationService.delete(id);
		return { success: true };
	}
}
