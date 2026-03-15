import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';
import { PoiService } from './poi.service';
import type { NearbyPoiQueryParams } from '@traces/types';

@Controller('pois')
@UseGuards(JwtAuthGuard)
export class PoiController {
	constructor(private readonly poiService: PoiService) {}

	@Get()
	async getNearbyPois(@Query() query: NearbyPoiQueryParams) {
		return this.poiService.findNearby(query);
	}

	@Get(':id')
	async getPoiDetail(@Param('id') id: string) {
		return this.poiService.getById(id);
	}
}
