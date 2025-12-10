import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { ThemesService } from './themes.service';
import {
	CreateCustomThemeDto,
	UpdateCustomThemeDto,
	PublishThemeDto,
	ThemeQueryDto,
	RateThemeDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller()
export class ThemesController {
	constructor(private readonly themesService: ThemesService) {}

	// ==================== Custom Themes ====================

	/**
	 * Create a new custom theme
	 */
	@Post('themes')
	@UseGuards(JwtAuthGuard)
	async createCustomTheme(@CurrentUser() user: CurrentUserData, @Body() dto: CreateCustomThemeDto) {
		return this.themesService.createCustomTheme(user.userId, dto);
	}

	/**
	 * Get all custom themes for the current user
	 */
	@Get('themes')
	@UseGuards(JwtAuthGuard)
	async getCustomThemes(@CurrentUser() user: CurrentUserData) {
		return this.themesService.getCustomThemes(user.userId);
	}

	/**
	 * Get a specific custom theme
	 */
	@Get('themes/:id')
	@UseGuards(JwtAuthGuard)
	async getCustomTheme(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.themesService.getCustomTheme(user.userId, id);
	}

	/**
	 * Update a custom theme
	 */
	@Patch('themes/:id')
	@UseGuards(JwtAuthGuard)
	async updateCustomTheme(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateCustomThemeDto
	) {
		return this.themesService.updateCustomTheme(user.userId, id, dto);
	}

	/**
	 * Delete a custom theme
	 */
	@Delete('themes/:id')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteCustomTheme(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.themesService.deleteCustomTheme(user.userId, id);
	}

	/**
	 * Publish a custom theme to the community
	 */
	@Post('themes/:id/publish')
	@UseGuards(JwtAuthGuard)
	async publishTheme(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: PublishThemeDto
	) {
		return this.themesService.publishTheme(user.userId, id, dto);
	}

	// ==================== Community Themes ====================

	/**
	 * Browse community themes with filtering, sorting, and pagination
	 */
	@Get('community-themes')
	async getCommunityThemes(@Query() query: ThemeQueryDto, @CurrentUser() user?: CurrentUserData) {
		return this.themesService.getCommunityThemes(query, user?.userId);
	}

	/**
	 * Get user's favorite community themes
	 */
	@Get('community-themes/favorites')
	@UseGuards(JwtAuthGuard)
	async getFavorites(@CurrentUser() user: CurrentUserData) {
		return this.themesService.getFavorites(user.userId);
	}

	/**
	 * Get user's downloaded community themes
	 */
	@Get('community-themes/downloaded')
	@UseGuards(JwtAuthGuard)
	async getDownloadedThemes(@CurrentUser() user: CurrentUserData) {
		return this.themesService.getDownloadedThemes(user.userId);
	}

	/**
	 * Get a specific community theme
	 */
	@Get('community-themes/:id')
	async getCommunityTheme(@Param('id') id: string, @CurrentUser() user?: CurrentUserData) {
		return this.themesService.getCommunityTheme(id, user?.userId);
	}

	/**
	 * Download/install a community theme
	 */
	@Post('community-themes/:id/download')
	@UseGuards(JwtAuthGuard)
	async downloadTheme(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.themesService.downloadTheme(user.userId, id);
	}

	/**
	 * Rate a community theme (1-5 stars)
	 */
	@Post('community-themes/:id/rate')
	@UseGuards(JwtAuthGuard)
	async rateTheme(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: RateThemeDto
	) {
		return this.themesService.rateTheme(user.userId, id, dto.rating);
	}

	/**
	 * Toggle favorite status for a community theme
	 */
	@Post('community-themes/:id/favorite')
	@UseGuards(JwtAuthGuard)
	async toggleFavorite(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.themesService.toggleFavorite(user.userId, id);
	}
}
