import {
	Controller,
	Get,
	Post,
	Put,
	Body,
	Param,
	Query,
	ParseIntPipe,
	UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GuildPoolService } from './guild-pool.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { UseCreditsDto } from './dto/use-credits.dto';
import { FundGuildPoolDto } from './dto/fund-guild-pool.dto';
import { SetSpendingLimitDto } from './dto/set-spending-limit.dto';

@ApiTags('credits/guild')
@ApiBearerAuth('JWT-auth')
@Controller('credits/guild')
@UseGuards(JwtAuthGuard)
export class GuildCreditController {
	constructor(private readonly guildPoolService: GuildPoolService) {}

	@Get(':guildId/balance')
	@ApiOperation({ summary: 'Get guild pool balance' })
	@ApiResponse({ status: 200, description: 'Returns guild pool balance' })
	@ApiResponse({ status: 403, description: 'Not a member of this guild' })
	async getBalance(@Param('guildId') guildId: string, @CurrentUser() user: CurrentUserData) {
		return this.guildPoolService.getGuildPoolBalance(guildId, user.userId);
	}

	@Post(':guildId/fund')
	@ApiOperation({ summary: 'Fund guild pool from personal balance' })
	@ApiResponse({ status: 200, description: 'Pool funded successfully' })
	@ApiResponse({ status: 400, description: 'Insufficient personal credits' })
	@ApiResponse({ status: 403, description: 'Only owners and admins can fund' })
	async fundPool(
		@Param('guildId') guildId: string,
		@CurrentUser() user: CurrentUserData,
		@Body() dto: FundGuildPoolDto
	) {
		return this.guildPoolService.fundGuildPool(
			guildId,
			user.userId,
			dto.amount,
			dto.idempotencyKey
		);
	}

	@Post(':guildId/use')
	@ApiOperation({ summary: 'Use credits from guild pool' })
	@ApiResponse({ status: 200, description: 'Credits used successfully' })
	@ApiResponse({ status: 400, description: 'Insufficient credits or spending limit exceeded' })
	@ApiResponse({ status: 403, description: 'Not a member of this guild' })
	async useCredits(
		@Param('guildId') guildId: string,
		@CurrentUser() user: CurrentUserData,
		@Body() dto: UseCreditsDto
	) {
		return this.guildPoolService.useGuildCredits(guildId, user.userId, dto);
	}

	@Get(':guildId/transactions')
	@ApiOperation({ summary: 'Get guild transaction history' })
	@ApiResponse({ status: 200, description: 'Returns guild transactions' })
	async getTransactions(
		@Param('guildId') guildId: string,
		@CurrentUser() user: CurrentUserData,
		@Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
		@Query('offset', new ParseIntPipe({ optional: true })) offset?: number
	) {
		return this.guildPoolService.getGuildTransactions(guildId, user.userId, limit, offset);
	}

	@Get(':guildId/members/:userId/spending')
	@ApiOperation({ summary: 'Get member spending summary' })
	@ApiResponse({ status: 200, description: 'Returns spending summary with limits' })
	async getMemberSpending(
		@Param('guildId') guildId: string,
		@Param('userId') targetUserId: string,
		@CurrentUser() user: CurrentUserData
	) {
		// Members can view their own spending, owners/admins can view any member
		const effectiveUserId = targetUserId === 'me' ? user.userId : targetUserId;
		return this.guildPoolService.getMemberSpendingSummary(guildId, effectiveUserId);
	}

	@Get(':guildId/members/:userId/limits')
	@ApiOperation({ summary: 'Get member spending limits' })
	@ApiResponse({ status: 200, description: 'Returns spending limits' })
	async getSpendingLimits(
		@Param('guildId') guildId: string,
		@Param('userId') targetUserId: string,
		@CurrentUser() user: CurrentUserData
	) {
		const effectiveUserId = targetUserId === 'me' ? user.userId : targetUserId;
		return this.guildPoolService.getSpendingLimits(guildId, effectiveUserId);
	}

	@Put(':guildId/members/:userId/limits')
	@ApiOperation({ summary: 'Set member spending limits' })
	@ApiResponse({ status: 200, description: 'Spending limits updated' })
	@ApiResponse({ status: 403, description: 'Only owners and admins can set limits' })
	async setSpendingLimits(
		@Param('guildId') guildId: string,
		@Param('userId') targetUserId: string,
		@CurrentUser() user: CurrentUserData,
		@Body() dto: SetSpendingLimitDto
	) {
		return this.guildPoolService.setSpendingLimit(
			guildId,
			user.userId,
			targetUserId,
			dto.dailyLimit,
			dto.monthlyLimit
		);
	}
}
