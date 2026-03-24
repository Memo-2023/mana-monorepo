import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { LocationService } from './location.service';
import { LocationLookupService } from './location-lookup.service';
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
	constructor(
		private readonly locationService: LocationService,
		private readonly lookupService: LocationLookupService
	) {}

	@Get()
	async findAll(
		@Query('category') category?: string,
		@Query('page') page?: string,
		@Query('limit') limit?: string
	) {
		const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
		const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20;

		const result = await this.locationService.findAll(category, pageNum, limitNum);
		return {
			locations: result.items,
			pagination: {
				total: result.total,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			},
		};
	}

	@Get('lookup')
	async lookup(@Query('q') query: string) {
		if (!query || query.trim().length === 0) {
			return { result: null };
		}
		const result = await this.lookupService.lookup(query.trim());
		return { result };
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
		const location = await this.locationService.create({
			...dto,
			createdBy: user.userId,
		});
		return { location };
	}

	@Put(':id')
	@UseGuards(JwtAuthGuard)
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateLocationDto
	) {
		const location = await this.locationService.update(id, dto, user.userId);
		return { location };
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.locationService.delete(id, user.userId);
		return { success: true };
	}
}
