import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	Headers,
} from '@nestjs/common';
import { FigureService } from './figure.service';
import { CreateFigureDto } from './dto/create-figure.dto';
import { UpdateFigureDto } from './dto/update-figure.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('figures')
export class FigureController {
	constructor(private readonly figureService: FigureService) {}

	/**
	 * Get public figures (no auth required)
	 * Optionally checks like status if authorization header present
	 */
	@Get('public')
	async getPublicFigures(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Headers('authorization') authHeader?: string
	) {
		const pageNum = page ? parseInt(page, 10) : 1;
		const limitNum = limit ? parseInt(limit, 10) : 20;

		// If no auth header, return without like status
		if (!authHeader) {
			return this.figureService.findPublicFigures(pageNum, limitNum);
		}

		// Try to extract user ID from token for like status
		// This is optional, so we don't throw on failure
		try {
			const token = authHeader.replace('Bearer ', '');
			const authUrl = process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001';
			const response = await fetch(`${authUrl}/api/v1/auth/validate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token }),
			});

			if (response.ok) {
				const { valid, payload } = await response.json();
				if (valid && payload) {
					return this.figureService.getPublicFiguresWithLikeStatus(payload.sub, pageNum, limitNum);
				}
			}
		} catch {
			// Ignore auth errors for public endpoint
		}

		return this.figureService.findPublicFigures(pageNum, limitNum);
	}

	/**
	 * Get a single figure by ID (no auth required)
	 */
	@Get(':id')
	async getFigure(@Param('id') id: string) {
		return this.figureService.findById(id);
	}

	/**
	 * Get current user's figures (auth required)
	 */
	@Get()
	@UseGuards(JwtAuthGuard)
	async getUserFigures(
		@CurrentUser() user: CurrentUserPayload,
		@Query('includeArchived') includeArchived?: string
	) {
		return this.figureService.findUserFigures(user.userId, includeArchived === 'true');
	}

	/**
	 * Create a new figure (auth required)
	 */
	@Post()
	@UseGuards(JwtAuthGuard)
	async createFigure(@Body() dto: CreateFigureDto, @CurrentUser() user: CurrentUserPayload) {
		return this.figureService.create(dto, user.userId);
	}

	/**
	 * Update a figure (auth required, must be owner)
	 */
	@Put(':id')
	@UseGuards(JwtAuthGuard)
	async updateFigure(
		@Param('id') id: string,
		@Body() dto: UpdateFigureDto,
		@CurrentUser() user: CurrentUserPayload
	) {
		return this.figureService.update(id, dto, user.userId);
	}

	/**
	 * Delete a figure (auth required, must be owner)
	 */
	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	async deleteFigure(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
		return this.figureService.delete(id, user.userId);
	}

	/**
	 * Toggle like on a figure (auth required)
	 */
	@Post(':id/like')
	@UseGuards(JwtAuthGuard)
	async toggleLike(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
		return this.figureService.toggleLike(id, user.userId);
	}
}
