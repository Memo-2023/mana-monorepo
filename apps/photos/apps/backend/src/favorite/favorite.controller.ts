import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { FavoriteService } from './favorite.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
	constructor(private favoriteService: FavoriteService) {}

	@Get()
	async findAll(
		@CurrentUser() user: CurrentUserData,
		@Query('limit') limit?: string,
		@Query('offset') offset?: string
	) {
		return this.favoriteService.findAll(
			user.userId,
			limit ? parseInt(limit) : 50,
			offset ? parseInt(offset) : 0
		);
	}

	@Get(':mediaId/status')
	async getStatus(@Param('mediaId') mediaId: string, @CurrentUser() user: CurrentUserData) {
		const isFavorited = await this.favoriteService.isFavorited(user.userId, mediaId);
		return { isFavorited };
	}

	@Post(':mediaId')
	async add(@Param('mediaId') mediaId: string, @CurrentUser() user: CurrentUserData) {
		await this.favoriteService.add(user.userId, mediaId);
		return { success: true, isFavorited: true };
	}

	@Delete(':mediaId')
	async remove(@Param('mediaId') mediaId: string, @CurrentUser() user: CurrentUserData) {
		await this.favoriteService.remove(user.userId, mediaId);
		return { success: true, isFavorited: false };
	}

	@Post(':mediaId/toggle')
	async toggle(@Param('mediaId') mediaId: string, @CurrentUser() user: CurrentUserData) {
		return this.favoriteService.toggle(user.userId, mediaId);
	}
}
