import { Controller, Get, Post, Body, UseGuards, Query, ParseIntPipe, Param } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUserData } from '../common/decorators/current-user.decorator';
import { type UseCreditsDto } from './dto/use-credits.dto';
import { type AllocateCreditsDto } from './dto/allocate-credits.dto';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
	constructor(private readonly creditsService: CreditsService) {}

	// ============================================================================
	// PERSONAL / B2C ENDPOINTS
	// ============================================================================

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

	// ============================================================================
	// ORGANIZATION / B2B ENDPOINTS
	// ============================================================================

	/**
	 * Allocate credits from organization to employee
	 * Only organization owners can allocate credits
	 */
	@Post('organization/allocate')
	async allocateCredits(
		@CurrentUser() user: CurrentUserData,
		@Body() allocateDto: AllocateCreditsDto
	) {
		return this.creditsService.allocateCredits(user.userId, allocateDto);
	}

	/**
	 * Get organization credit balance and allocation stats
	 */
	@Get('organization/:organizationId/balance')
	async getOrganizationBalance(@Param('organizationId') organizationId: string) {
		return this.creditsService.getOrganizationBalance(organizationId);
	}

	/**
	 * Get employee's credit balance within an organization context
	 */
	@Get('organization/:organizationId/employee/:employeeId/balance')
	async getEmployeeBalance(
		@Param('organizationId') organizationId: string,
		@Param('employeeId') employeeId: string
	) {
		return this.creditsService.getEmployeeCreditBalance(employeeId, organizationId);
	}

	/**
	 * Deduct credits with organization tracking (for B2B usage)
	 */
	@Post('organization/:organizationId/use')
	async deductCreditsWithOrgTracking(
		@CurrentUser() user: CurrentUserData,
		@Param('organizationId') organizationId: string,
		@Body() useCreditsDto: UseCreditsDto
	) {
		return this.creditsService.deductCredits(user.userId, useCreditsDto, organizationId);
	}
}
