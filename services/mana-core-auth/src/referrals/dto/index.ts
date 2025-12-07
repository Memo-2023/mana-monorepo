/**
 * Referral DTOs
 *
 * Data Transfer Objects for the referral system API endpoints.
 */

import { IsString, IsOptional, IsNotEmpty, Matches, MinLength, MaxLength } from 'class-validator';

// ============================================
// CODE MANAGEMENT DTOs
// ============================================

/**
 * DTO for creating a custom referral code
 */
export class CreateCustomCodeDto {
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	@MaxLength(20)
	@Matches(/^[A-Z0-9-]+$/, {
		message: 'Code must contain only uppercase letters, numbers, and hyphens',
	})
	code: string;

	@IsString()
	@IsOptional()
	sourceAppId?: string;
}

/**
 * DTO for validating a referral code (public endpoint)
 */
export class ValidateCodeDto {
	@IsString()
	@IsNotEmpty()
	code: string;
}

// ============================================
// REFERRAL TRACKING DTOs
// ============================================

/**
 * DTO for applying a referral code during registration
 */
export class ApplyReferralDto {
	@IsString()
	@IsNotEmpty()
	refereeId: string;

	@IsString()
	@IsNotEmpty()
	code: string;

	@IsString()
	@IsOptional()
	sourceAppId?: string;

	@IsString()
	@IsOptional()
	ipAddress?: string;

	@IsString()
	@IsOptional()
	deviceFingerprint?: string;

	@IsString()
	@IsOptional()
	userAgent?: string;
}

/**
 * DTO for stage update (internal service-to-service)
 */
export class StageUpdateDto {
	@IsString()
	@IsNotEmpty()
	userId: string;

	@IsString()
	@IsNotEmpty()
	stage: 'activated' | 'qualified';

	@IsString()
	@IsOptional()
	appId?: string;

	@IsOptional()
	metadata?: Record<string, unknown>;
}

/**
 * DTO for cross-app activation (internal)
 */
export class CrossAppActivationDto {
	@IsString()
	@IsNotEmpty()
	userId: string;

	@IsString()
	@IsNotEmpty()
	appId: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface CodeValidationResponse {
	valid: boolean;
	referrerName?: string;
	bonusCredits: number;
	error?: string;
}

export interface ReferralCodeResponse {
	id: string;
	code: string;
	type: 'auto' | 'custom' | 'campaign';
	isActive: boolean;
	usesCount: number;
	createdAt: Date;
}

export interface ApplyReferralResponse {
	success: boolean;
	referralId?: string;
	bonusAwarded?: number;
	fraudScore?: number;
	error?: string;
}

export interface TierInfo {
	current: 'bronze' | 'silver' | 'gold' | 'platinum';
	multiplier: number;
	qualifiedCount: number;
	nextTier: 'silver' | 'gold' | 'platinum' | null;
	nextTierAt: number | null;
	progress: number;
}

export interface ReferralStats {
	tier: TierInfo;
	totals: {
		registered: number;
		activated: number;
		qualified: number;
		retained: number;
		creditsEarned: number;
		creditsPending: number;
	};
	byApp: Record<
		string,
		{
			registered: number;
			activated: number;
			qualified: number;
			credits: number;
		}
	>;
	recentActivity: Array<{
		type: string;
		refereeName: string;
		credits: number;
		app?: string;
		at: Date;
	}>;
}

export interface ReferredUser {
	id: string;
	name: string;
	status: 'registered' | 'activated' | 'qualified' | 'retained';
	registeredAt: Date;
	activatedAt?: Date;
	qualifiedAt?: Date;
	retainedAt?: Date;
	appsUsed: string[];
	creditsEarned: number;
	isFlagged: boolean;
}

export interface PaginatedResponse<T> {
	items: T[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
	};
}
