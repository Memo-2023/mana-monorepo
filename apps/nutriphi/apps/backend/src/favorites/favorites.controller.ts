import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { FavoritesService } from './favorites.service';
import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';

class CreateFavoriteDto {
	@IsString()
	name!: string;

	@IsString()
	description!: string;

	@IsEnum(['breakfast', 'lunch', 'dinner', 'snack'])
	mealType!: 'breakfast' | 'lunch' | 'dinner' | 'snack';

	@IsObject()
	nutrition!: Record<string, number>;
}

class UpdateFavoriteDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;
}

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
	constructor(private readonly favoritesService: FavoritesService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.favoritesService.findAll(user.userId);
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateFavoriteDto) {
		return this.favoritesService.create(user.userId, dto);
	}

	@Post(':id/use')
	async use(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.favoritesService.incrementUsage(user.userId, id);
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateFavoriteDto
	) {
		return this.favoritesService.update(user.userId, id, dto);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.favoritesService.delete(user.userId, id);
	}
}
