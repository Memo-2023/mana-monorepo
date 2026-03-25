import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { LocationService } from './location.service';
import { LocationLookupService } from './location-lookup.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import type { OpeningHours } from '../db/schema/locations.schema';

class CreateLocationDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsString()
	@IsNotEmpty()
	category!:
		| 'sight'
		| 'restaurant'
		| 'shop'
		| 'museum'
		| 'cafe'
		| 'bar'
		| 'park'
		| 'beach'
		| 'hotel'
		| 'event_venue'
		| 'viewpoint';

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

	@IsString()
	@IsOptional()
	website?: string;

	@IsString()
	@IsOptional()
	phone?: string;

	@IsObject()
	@IsOptional()
	openingHours?: OpeningHours;
}

class UpdateLocationDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsString()
	@IsOptional()
	category?:
		| 'sight'
		| 'restaurant'
		| 'shop'
		| 'museum'
		| 'cafe'
		| 'bar'
		| 'park'
		| 'beach'
		| 'hotel'
		| 'event_venue'
		| 'viewpoint';

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

	@IsString()
	@IsOptional()
	website?: string;

	@IsString()
	@IsOptional()
	phone?: string;

	@IsObject()
	@IsOptional()
	openingHours?: OpeningHours;
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

	@Get('suggestions')
	async suggestions(@Query('q') query: string) {
		if (!query || query.trim().length === 0) {
			return { suggestions: [] };
		}
		const suggestions = await this.locationService.searchSuggestions(query.trim());
		return { suggestions };
	}

	@Get(':id')
	async findById(@Param('id') id: string) {
		const location = await this.locationService.findByIdOrSlug(id);
		return { location };
	}

	@Get(':id/nearby')
	async findNearby(@Param('id') id: string, @Query('radius') radius?: string) {
		const radiusKm = radius ? Math.min(10, Math.max(0.5, parseFloat(radius))) : 2;
		const nearby = await this.locationService.findNearby(id, radiusKm);
		return { locations: nearby };
	}

	@Post(':id/images')
	@UseGuards(JwtAuthGuard)
	async addImage(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() body: { imageUrl: string }
	) {
		const location = await this.locationService.addImage(id, body.imageUrl, user.userId);
		return { location };
	}

	@Post()
	@UseGuards(JwtAuthGuard, RateLimitGuard)
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateLocationDto) {
		const location = await this.locationService.create({
			...dto,
			createdBy: user.userId,
		});
		return { location };
	}

	@Put(':id')
	@UseGuards(JwtAuthGuard, RateLimitGuard)
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateLocationDto
	) {
		const location = await this.locationService.update(id, dto, user.userId);
		return { location };
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard, RateLimitGuard)
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.locationService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/restore')
	@UseGuards(JwtAuthGuard)
	async restore(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const location = await this.locationService.restore(id, user.userId);
		return { location };
	}
}
