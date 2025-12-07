/**
 * Referrals Controller
 *
 * API endpoints for the referral system.
 *
 * Public endpoints:
 * - GET /referrals/validate/:code - Validate a referral code
 *
 * Authenticated endpoints:
 * - GET /referrals/codes - Get user's referral codes
 * - POST /referrals/codes - Create custom code
 * - DELETE /referrals/codes/:id - Deactivate a code
 * - GET /referrals/stats - Get referral statistics
 * - GET /referrals/referred-users - Get list of referred users
 *
 * Internal endpoints (service-to-service):
 * - POST /referrals/internal/apply - Apply referral during registration
 * - POST /referrals/internal/stage-update - Update referral stage
 * - POST /referrals/internal/cross-app - Track cross-app usage
 */

import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	Query,
	Headers,
	UseGuards,
	HttpCode,
	HttpStatus,
	BadRequestException,
} from '@nestjs/common';
import { ReferralCodeService } from './services/referral-code.service';
import { ReferralTrackingService } from './services/referral-tracking.service';
import { ReferralTierService } from './services/referral-tier.service';
import {
	CreateCustomCodeDto,
	ApplyReferralDto,
	StageUpdateDto,
	CrossAppActivationDto,
} from './dto';

// Simple auth decorator (will use actual JWT guard in production)
// For now, we'll extract userId from Authorization header
function extractUserId(authHeader?: string): string | null {
	if (!authHeader) return null;
	// In production, this would verify JWT and extract userId
	// For now, we'll assume the header contains "Bearer <userId>" for testing
	const parts = authHeader.split(' ');
	if (parts.length === 2 && parts[0] === 'Bearer') {
		return parts[1];
	}
	return null;
}

@Controller('referrals')
export class ReferralsController {
	constructor(
		private codeService: ReferralCodeService,
		private trackingService: ReferralTrackingService,
		private tierService: ReferralTierService
	) {}

	// ============================================
	// PUBLIC ENDPOINTS
	// ============================================

	/**
	 * Validate a referral code (public)
	 * Used during registration to show bonus info
	 */
	@Get('validate/:code')
	async validateCode(@Param('code') code: string) {
		return this.codeService.validateCode(code);
	}

	// ============================================
	// AUTHENTICATED ENDPOINTS
	// ============================================

	/**
	 * Get user's referral codes
	 */
	@Get('codes')
	async getCodes(@Headers('authorization') authHeader: string) {
		const userId = extractUserId(authHeader);
		if (!userId) {
			throw new BadRequestException('Authentication required');
		}

		const codes = await this.codeService.getUserCodes(userId);
		const primaryCode = await this.codeService.getPrimaryCode(userId);

		return {
			codes,
			autoCode: primaryCode,
		};
	}

	/**
	 * Create a custom referral code
	 */
	@Post('codes')
	@HttpCode(HttpStatus.CREATED)
	async createCode(@Headers('authorization') authHeader: string, @Body() dto: CreateCustomCodeDto) {
		const userId = extractUserId(authHeader);
		if (!userId) {
			throw new BadRequestException('Authentication required');
		}

		const code = await this.codeService.createCustomCode(userId, dto);

		return {
			code: {
				id: code.id,
				code: code.code,
				type: code.type,
				isActive: code.isActive,
				usesCount: code.usesCount,
				createdAt: code.createdAt,
			},
		};
	}

	/**
	 * Deactivate a referral code
	 */
	@Delete('codes/:id')
	@HttpCode(HttpStatus.OK)
	async deactivateCode(@Headers('authorization') authHeader: string, @Param('id') codeId: string) {
		const userId = extractUserId(authHeader);
		if (!userId) {
			throw new BadRequestException('Authentication required');
		}

		const success = await this.codeService.deactivateCode(userId, codeId);

		return { success };
	}

	/**
	 * Get referral statistics
	 */
	@Get('stats')
	async getStats(@Headers('authorization') authHeader: string) {
		const userId = extractUserId(authHeader);
		if (!userId) {
			throw new BadRequestException('Authentication required');
		}

		return this.trackingService.getReferralStats(userId);
	}

	/**
	 * Get list of referred users
	 */
	@Get('referred-users')
	async getReferredUsers(
		@Headers('authorization') authHeader: string,
		@Query('status') status?: string,
		@Query('limit') limit?: string,
		@Query('offset') offset?: string
	) {
		const userId = extractUserId(authHeader);
		if (!userId) {
			throw new BadRequestException('Authentication required');
		}

		return this.trackingService.getReferredUsers(
			userId,
			status,
			limit ? parseInt(limit, 10) : 20,
			offset ? parseInt(offset, 10) : 0
		);
	}

	/**
	 * Get user's tier information
	 */
	@Get('tier')
	async getTier(@Headers('authorization') authHeader: string) {
		const userId = extractUserId(authHeader);
		if (!userId) {
			throw new BadRequestException('Authentication required');
		}

		return this.tierService.getUserTier(userId);
	}

	// ============================================
	// INTERNAL ENDPOINTS (Service-to-Service)
	// ============================================

	/**
	 * Apply referral code during registration (internal)
	 * Called by the auth service during user registration
	 */
	@Post('internal/apply')
	@HttpCode(HttpStatus.OK)
	async applyReferral(@Headers('x-service-key') serviceKey: string, @Body() dto: ApplyReferralDto) {
		// In production, validate service key
		// For now, we'll skip validation

		return this.trackingService.applyReferral(dto);
	}

	/**
	 * Update referral stage (internal)
	 * Called by credits service when user activates or qualifies
	 */
	@Post('internal/stage-update')
	@HttpCode(HttpStatus.OK)
	async stageUpdate(@Headers('x-service-key') serviceKey: string, @Body() dto: StageUpdateDto) {
		if (dto.stage === 'activated') {
			const success = await this.trackingService.checkActivation(dto.userId);
			return { success, stage: 'activated' };
		} else if (dto.stage === 'qualified') {
			const success = await this.trackingService.checkQualification(dto.userId);
			return { success, stage: 'qualified' };
		}

		return { success: false, error: 'invalid_stage' };
	}

	/**
	 * Track cross-app usage (internal)
	 * Called by credits service when user uses a new app
	 */
	@Post('internal/cross-app')
	@HttpCode(HttpStatus.OK)
	async trackCrossApp(
		@Headers('x-service-key') serviceKey: string,
		@Body() dto: CrossAppActivationDto
	) {
		const success = await this.trackingService.trackCrossAppUsage(dto.userId, dto.appId);
		return { success, isNewApp: success };
	}

	/**
	 * Initialize user's referral data (internal)
	 * Called during user registration to create auto-code and tier
	 */
	@Post('internal/initialize')
	@HttpCode(HttpStatus.OK)
	async initializeUser(
		@Headers('x-service-key') serviceKey: string,
		@Body() body: { userId: string }
	) {
		// Create auto code
		const code = await this.codeService.createAutoCode(body.userId);

		// Initialize tier
		const tier = await this.tierService.initializeUserTier(body.userId);

		return {
			success: true,
			code: code.code,
			tier: tier.tier,
		};
	}
}
