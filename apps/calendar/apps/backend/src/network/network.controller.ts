import { Controller, Get, UseGuards, Headers } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { NetworkService } from './network.service';

@Controller('network')
@UseGuards(JwtAuthGuard)
export class NetworkController {
	constructor(private readonly networkService: NetworkService) {}

	@Get('graph')
	async getGraph(
		@CurrentUser() user: CurrentUserData,
		@Headers('authorization') authorization?: string
	) {
		const accessToken = authorization?.replace('Bearer ', '');
		return this.networkService.getGraph(user.userId, accessToken);
	}
}
