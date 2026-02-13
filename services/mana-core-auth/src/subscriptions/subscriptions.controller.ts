import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from './dto/create-portal-session.dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
	constructor(private readonly subscriptionsService: SubscriptionsService) {}

	// ============================================================================
	// PUBLIC ENDPOINTS
	// ============================================================================

	@Get('plans')
	@ApiOperation({ summary: 'Get all available subscription plans' })
	@ApiResponse({ status: 200, description: 'Returns list of active plans' })
	async getPlans() {
		return this.subscriptionsService.getPlans();
	}

	@Get('plans/:planId')
	@ApiOperation({ summary: 'Get a specific plan' })
	@ApiResponse({ status: 200, description: 'Returns plan details' })
	@ApiResponse({ status: 404, description: 'Plan not found' })
	async getPlan(@Param('planId') planId: string) {
		return this.subscriptionsService.getPlan(planId);
	}

	// ============================================================================
	// PROTECTED ENDPOINTS
	// ============================================================================

	@Get('current')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Get current subscription' })
	@ApiResponse({ status: 200, description: 'Returns current subscription and plan' })
	async getCurrentSubscription(@CurrentUser() user: CurrentUserData) {
		return this.subscriptionsService.getCurrentSubscription(user.userId);
	}

	@Post('checkout')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Create Stripe checkout session for subscription' })
	@ApiResponse({ status: 201, description: 'Returns checkout session URL' })
	async createCheckoutSession(
		@CurrentUser() user: CurrentUserData,
		@Body() dto: CreateCheckoutSessionDto
	) {
		return this.subscriptionsService.createCheckoutSession(
			user.userId,
			dto.planId,
			dto.billingInterval,
			dto.successUrl,
			dto.cancelUrl
		);
	}

	@Post('portal')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Create Stripe Customer Portal session' })
	@ApiResponse({ status: 201, description: 'Returns portal URL for billing management' })
	async createPortalSession(
		@CurrentUser() user: CurrentUserData,
		@Body() dto: CreatePortalSessionDto
	) {
		return this.subscriptionsService.createPortalSession(user.userId, dto.returnUrl);
	}

	@Post('cancel')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Cancel subscription at period end' })
	@ApiResponse({ status: 200, description: 'Subscription scheduled for cancellation' })
	async cancelSubscription(@CurrentUser() user: CurrentUserData) {
		return this.subscriptionsService.cancelSubscription(user.userId);
	}

	@Post('reactivate')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Reactivate a canceled subscription' })
	@ApiResponse({ status: 200, description: 'Subscription reactivated' })
	async reactivateSubscription(@CurrentUser() user: CurrentUserData) {
		return this.subscriptionsService.reactivateSubscription(user.userId);
	}

	@Get('invoices')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Get invoice history' })
	@ApiResponse({ status: 200, description: 'Returns list of invoices' })
	async getInvoices(@CurrentUser() user: CurrentUserData, @Query('limit') limit?: number) {
		return this.subscriptionsService.getInvoices(user.userId, limit);
	}
}
