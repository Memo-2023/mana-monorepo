import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	Headers,
	UnauthorizedException,
	ConflictException,
} from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { IsString, IsNotEmpty } from 'class-validator';

class CreateFavoriteDto {
	@IsString()
	@IsNotEmpty()
	quoteId!: string;
}

// Simple JWT extraction - in production, use proper auth middleware
function extractUserId(authHeader?: string): string {
	if (!authHeader?.startsWith('Bearer ')) {
		throw new UnauthorizedException('Missing or invalid authorization header');
	}

	try {
		const token = authHeader.substring(7);
		const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
		if (!payload.sub) {
			throw new UnauthorizedException('Invalid token payload');
		}
		return payload.sub;
	} catch {
		throw new UnauthorizedException('Invalid token');
	}
}

@Controller('favorites')
export class FavoriteController {
	constructor(private readonly favoriteService: FavoriteService) {}

	@Get()
	async findAll(@Headers('authorization') authHeader: string) {
		const userId = extractUserId(authHeader);
		const favorites = await this.favoriteService.findByUserId(userId);
		return { favorites };
	}

	@Post()
	async create(@Headers('authorization') authHeader: string, @Body() dto: CreateFavoriteDto) {
		const userId = extractUserId(authHeader);

		// Check if already favorited
		const exists = await this.favoriteService.exists(userId, dto.quoteId);
		if (exists) {
			throw new ConflictException('Quote already in favorites');
		}

		const favorite = await this.favoriteService.create({
			userId,
			quoteId: dto.quoteId,
		});
		return { favorite };
	}

	@Delete(':quoteId')
	async delete(@Headers('authorization') authHeader: string, @Param('quoteId') quoteId: string) {
		const userId = extractUserId(authHeader);
		await this.favoriteService.delete(userId, quoteId);
		return { success: true };
	}
}
