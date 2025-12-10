import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { NetworkService } from './network.service';

@Controller('api/v1/network')
@UseGuards(JwtAuthGuard)
export class NetworkController {
	constructor(private readonly networkService: NetworkService) {}

	@Get('graph')
	async getGraph(@CurrentUser() user: CurrentUserData) {
		return this.networkService.getGraph(user.userId);
	}
}
