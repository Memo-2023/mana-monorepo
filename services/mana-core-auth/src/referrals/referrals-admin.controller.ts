/**
 * Referrals Admin Controller
 *
 * Admin-only endpoints for managing the referral system:
 * - Review queue management
 * - Fraud pattern management
 * - Statistics and reporting
 */

import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { FraudDetectionService } from './services/fraud-detection.service';
import { ReferralTrackingService } from './services/referral-tracking.service';

// DTOs for admin endpoints
class ProcessReviewDto {
	decision: 'approved' | 'rejected';
	reviewerId: string;
	notes?: string;
}

class AddFraudPatternDto {
	patternType: 'email_domain' | 'ip_range' | 'device_pattern';
	patternValue: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	scoreImpact: number;
	description: string;
	createdBy: string;
}

class PaginationQuery {
	limit?: string;
	offset?: string;
}

// Note: In production, add proper auth guard
// @UseGuards(AdminAuthGuard)
@Controller('referrals/admin')
export class ReferralsAdminController {
	constructor(
		private fraudDetectionService: FraudDetectionService,
		private trackingService: ReferralTrackingService
	) {}

	// ===================================
	// REVIEW QUEUE ENDPOINTS
	// ===================================

	/**
	 * Get pending review items
	 * GET /referrals/admin/reviews
	 */
	@Get('reviews')
	async getPendingReviews(@Query() query: PaginationQuery) {
		const limit = parseInt(query.limit || '50', 10);
		const offset = parseInt(query.offset || '0', 10);

		const reviews = await this.fraudDetectionService.getPendingReviews(limit, offset);

		return {
			items: reviews,
			pagination: {
				limit,
				offset,
			},
		};
	}

	/**
	 * Process a review decision
	 * POST /referrals/admin/reviews/:id/process
	 */
	@Post('reviews/:id/process')
	@HttpCode(HttpStatus.OK)
	async processReview(@Param('id') reviewId: string, @Body() dto: ProcessReviewDto) {
		await this.fraudDetectionService.processReview(
			reviewId,
			dto.decision,
			dto.reviewerId,
			dto.notes
		);

		return {
			success: true,
			message: `Review ${dto.decision}`,
		};
	}

	// ===================================
	// FRAUD PATTERN ENDPOINTS
	// ===================================

	/**
	 * Add a new fraud pattern
	 * POST /referrals/admin/fraud-patterns
	 */
	@Post('fraud-patterns')
	@HttpCode(HttpStatus.CREATED)
	async addFraudPattern(@Body() dto: AddFraudPatternDto) {
		await this.fraudDetectionService.addFraudPattern(
			dto.patternType,
			dto.patternValue,
			dto.severity,
			dto.scoreImpact,
			dto.description,
			dto.createdBy
		);

		return {
			success: true,
			message: 'Fraud pattern added',
		};
	}

	// ===================================
	// STATISTICS ENDPOINTS
	// ===================================

	/**
	 * Get fraud statistics
	 * GET /referrals/admin/stats/fraud
	 */
	@Get('stats/fraud')
	async getFraudStats() {
		return this.fraudDetectionService.getFraudStats();
	}

	/**
	 * Get overall referral statistics
	 * GET /referrals/admin/stats/overview
	 */
	@Get('stats/overview')
	async getOverviewStats() {
		return {
			message: 'Overview stats endpoint - to be implemented with aggregated data',
		};
	}

	// ===================================
	// USER MANAGEMENT ENDPOINTS
	// ===================================

	/**
	 * Get referral details for a specific user
	 * GET /referrals/admin/users/:userId/referrals
	 */
	@Get('users/:userId/referrals')
	async getUserReferrals(
		@Param('userId') userId: string,
		@Query('status') status: string | undefined,
		@Query() query: PaginationQuery
	) {
		const limit = parseInt(query.limit || '50', 10);
		const offset = parseInt(query.offset || '0', 10);

		const result = await this.trackingService.getReferredUsers(userId, status, limit, offset);

		return result;
	}

	/**
	 * Get referral stats for a specific user
	 * GET /referrals/admin/users/:userId/stats
	 */
	@Get('users/:userId/stats')
	async getUserStats(@Param('userId') userId: string) {
		return this.trackingService.getReferralStats(userId);
	}

	// ===================================
	// MANUAL ACTIONS
	// ===================================

	/**
	 * Manually trigger stage update (for support/admin use)
	 * POST /referrals/admin/manual/stage-update
	 */
	@Post('manual/stage-update')
	@HttpCode(HttpStatus.OK)
	async manualStageUpdate(
		@Body() dto: { userId: string; stage: 'activated' | 'qualified'; appId?: string }
	) {
		if (dto.stage === 'activated') {
			await this.trackingService.checkActivation(dto.userId);
		} else if (dto.stage === 'qualified') {
			await this.trackingService.checkQualification(dto.userId);
		}

		return {
			success: true,
			message: `Stage update processed for user ${dto.userId}`,
		};
	}
}
