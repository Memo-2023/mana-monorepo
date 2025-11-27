import { Controller, Get, Post, Body, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { UseCreditsDto } from './dto/use-credits.dto';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
	constructor(private readonly creditsService: CreditsService) {}

	@Get('balance')
	async getBalance(@CurrentUser() user: CurrentUserData) {
		return this.creditsService.getBalance(user.userId);
	}

	@Post('use')
	async useCredits(@CurrentUser() user: CurrentUserData, @Body() useCreditsDto: UseCreditsDto) {
		return this.creditsService.useCredits(user.userId, useCreditsDto);
	}

	@Get('transactions')
	async getTransactionHistory(
		@CurrentUser() user: CurrentUserData,
		@Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
		@Query('offset', new ParseIntPipe({ optional: true })) offset?: number
	) {
		return this.creditsService.getTransactionHistory(user.userId, limit, offset);
	}

	@Get('purchases')
	async getPurchaseHistory(@CurrentUser() user: CurrentUserData) {
		return this.creditsService.getPurchaseHistory(user.userId);
	}

	@Get('packages')
	async getPackages() {
		return this.creditsService.getPackages();
	}
}
