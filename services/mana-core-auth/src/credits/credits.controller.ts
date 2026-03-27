import { Controller, Get, Post, Body, UseGuards, Query, ParseIntPipe, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { UseCreditsDto } from './dto/use-credits.dto';
import { PurchaseCreditsDto } from './dto/purchase-credits.dto';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';

@ApiTags('credits')
@ApiBearerAuth('JWT-auth')
@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
	constructor(private readonly creditsService: CreditsService) {}

	// ============================================================================
	// PERSONAL / B2C ENDPOINTS
	// ============================================================================

	@Get('balance')
	@ApiOperation({ summary: 'Get current credit balance' })
	@ApiResponse({ status: 200, description: 'Returns user credit balance' })
	async getBalance(@CurrentUser() user: CurrentUserData) {
		return this.creditsService.getBalance(user.userId);
	}

	@Post('use')
	@ApiOperation({ summary: 'Use credits (personal or guild pool)' })
	@ApiResponse({ status: 200, description: 'Credits used successfully' })
	async useCredits(@CurrentUser() user: CurrentUserData, @Body() useCreditsDto: UseCreditsDto) {
		return this.creditsService.useCreditsWithSource(user.userId, useCreditsDto);
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
	@ApiOperation({ summary: 'Get available credit packages' })
	@ApiResponse({ status: 200, description: 'Returns list of active credit packages' })
	async getPackages() {
		return this.creditsService.getPackages();
	}

	@Post('purchase')
	@ApiOperation({ summary: 'Initiate credit purchase' })
	@ApiResponse({
		status: 201,
		description: 'Returns Stripe PaymentIntent client secret for frontend payment',
	})
	@ApiResponse({ status: 404, description: 'Package not found' })
	async initiatePurchase(@CurrentUser() user: CurrentUserData, @Body() dto: PurchaseCreditsDto) {
		return this.creditsService.initiatePurchase(user.userId, dto.packageId);
	}

	@Get('purchase/:purchaseId')
	@ApiOperation({ summary: 'Get purchase status' })
	@ApiResponse({ status: 200, description: 'Returns purchase details and status' })
	@ApiResponse({ status: 404, description: 'Purchase not found' })
	async getPurchaseStatus(
		@CurrentUser() user: CurrentUserData,
		@Param('purchaseId') purchaseId: string
	) {
		return this.creditsService.getPurchaseStatus(user.userId, purchaseId);
	}

	@Post('payment-link')
	@ApiOperation({ summary: 'Create payment link for credit purchase' })
	@ApiResponse({
		status: 201,
		description: 'Returns Stripe Checkout URL for payment',
		schema: {
			properties: {
				url: { type: 'string', description: 'Stripe Checkout URL' },
				purchaseId: { type: 'string', description: 'Purchase ID for tracking' },
				expiresAt: { type: 'string', format: 'date-time', description: 'Link expiration time' },
				package: {
					type: 'object',
					properties: {
						name: { type: 'string' },
						credits: { type: 'number' },
						priceEuroCents: { type: 'number' },
					},
				},
			},
		},
	})
	@ApiResponse({ status: 404, description: 'Package not found' })
	async createPaymentLink(@CurrentUser() user: CurrentUserData, @Body() dto: CreatePaymentLinkDto) {
		return this.creditsService.createPaymentLink(user.userId, dto.packageId, {
			successUrl: dto.successUrl,
			cancelUrl: dto.cancelUrl,
			roomId: dto.roomId,
		});
	}
}
