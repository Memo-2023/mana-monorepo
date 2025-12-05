import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { SearchService } from './search.service';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class SearchController {
	constructor(private readonly searchService: SearchService) {}

	@Get('search')
	async search(@CurrentUser() user: CurrentUserData, @Query('q') query: string) {
		if (!query || query.trim().length === 0) {
			return { files: [], folders: [] };
		}
		return this.searchService.search(user.userId, query.trim());
	}

	@Get('favorites')
	async getFavorites(@CurrentUser() user: CurrentUserData) {
		return this.searchService.getFavorites(user.userId);
	}
}
