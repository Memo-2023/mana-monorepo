import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { NetworkService } from './network.service';
import { IsString, IsOptional, IsIn } from 'class-validator';

class NetworkQueryDto {
	@IsString()
	@IsOptional()
	@IsIn(['tags'])
	type?: 'tags';
}

@Controller('network')
@UseGuards(JwtAuthGuard)
export class NetworkController {
	constructor(private readonly networkService: NetworkService) {}

	@Get('graph')
	async getGraph(@CurrentUser() user: CurrentUserData, @Query() query: NetworkQueryDto) {
		// Currently only tag-based graph is supported (MVP)
		const graph = await this.networkService.getTagBasedGraph(user.userId);
		return graph;
	}
}
