import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	UseGuards,
	ConflictException,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { FavoriteService } from './favorite.service';
import { IsString, IsNotEmpty } from 'class-validator';

class CreateFavoriteDto {
	@IsString()
	@IsNotEmpty()
	quoteId!: string;
}

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
	constructor(private readonly favoriteService: FavoriteService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const favorites = await this.favoriteService.findByUserId(user.userId);
		return { favorites };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateFavoriteDto) {
		// Check if already favorited
		const exists = await this.favoriteService.exists(user.userId, dto.quoteId);
		if (exists) {
			throw new ConflictException('Quote already in favorites');
		}

		const favorite = await this.favoriteService.create({
			userId: user.userId,
			quoteId: dto.quoteId,
		});
		return { favorite };
	}

	@Delete(':quoteId')
	async delete(@CurrentUser() user: CurrentUserData, @Param('quoteId') quoteId: string) {
		await this.favoriteService.delete(user.userId, quoteId);
		return { success: true };
	}
}
