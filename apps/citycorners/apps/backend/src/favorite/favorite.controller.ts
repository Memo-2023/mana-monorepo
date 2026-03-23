import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { FavoriteService } from './favorite.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
	constructor(private readonly favoriteService: FavoriteService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const favorites = await this.favoriteService.findByUserId(user.userId);
		return { favorites };
	}

	@Post(':locationId')
	async add(@CurrentUser() user: CurrentUserData, @Param('locationId') locationId: string) {
		const favorite = await this.favoriteService.add(user.userId, locationId);
		return { favorite };
	}

	@Delete(':locationId')
	async remove(@CurrentUser() user: CurrentUserData, @Param('locationId') locationId: string) {
		await this.favoriteService.remove(user.userId, locationId);
		return { success: true };
	}
}
