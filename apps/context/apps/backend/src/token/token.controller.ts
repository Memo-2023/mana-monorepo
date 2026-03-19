import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { TokenService } from './token.service';

@Controller('tokens')
@UseGuards(JwtAuthGuard)
export class TokenController {
	constructor(private readonly tokenService: TokenService) {}

	@Get('balance')
	async getBalance(@CurrentUser() user: CurrentUserData) {
		const balance = await this.tokenService.getBalance(user.userId);
		return { balance };
	}

	@Get('stats')
	async getStats(@CurrentUser() user: CurrentUserData, @Query('timeframe') timeframe?: string) {
		const stats = await this.tokenService.getUsageStats(
			user.userId,
			(timeframe as 'day' | 'week' | 'month' | 'year') || 'month'
		);
		return { stats };
	}

	@Get('transactions')
	async getTransactions(
		@CurrentUser() user: CurrentUserData,
		@Query('limit') limit?: string,
		@Query('offset') offset?: string
	) {
		const transactions = await this.tokenService.getTransactions(
			user.userId,
			limit ? parseInt(limit, 10) : 20,
			offset ? parseInt(offset, 10) : 0
		);
		return { transactions };
	}

	@Get('models')
	async getModelPrices() {
		const models = await this.tokenService.getModelPrices();
		return { models };
	}
}
