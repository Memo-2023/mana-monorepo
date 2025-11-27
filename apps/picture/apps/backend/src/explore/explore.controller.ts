import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ExploreService } from './explore.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetPublicImagesDto, SearchPublicImagesDto } from './dto/explore.dto';

@Controller('explore')
@UseGuards(JwtAuthGuard)
export class ExploreController {
	constructor(private readonly exploreService: ExploreService) {}

	@Get()
	async getPublicImages(@Query() query: GetPublicImagesDto) {
		return this.exploreService.getPublicImages(query);
	}

	@Get('search')
	async searchPublicImages(@Query() query: SearchPublicImagesDto) {
		return this.exploreService.searchPublicImages(query);
	}
}
