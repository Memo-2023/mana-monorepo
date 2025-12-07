/**
 * Referral Code Service
 *
 * Handles referral code generation, validation, and management.
 * - Auto-generates codes for new users
 * - Validates codes for registration
 * - Manages custom codes created by users
 */

import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../../db/connection';
import {
	codes,
	rateLimits,
	RATE_LIMITS,
	type ReferralCode,
	type NewReferralCode,
} from '../../db/schema/referrals.schema';
import { users } from '../../db/schema/auth.schema';
import type { CreateCustomCodeDto, CodeValidationResponse, ReferralCodeResponse } from '../dto';

// Characters for auto-generated codes (excluding confusable: 0/O, 1/I/L)
const CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const AUTO_CODE_LENGTH = 6;

@Injectable()
export class ReferralCodeService {
	constructor(private configService: ConfigService) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Generate a random code string
	 */
	private generateRandomCode(length: number = AUTO_CODE_LENGTH): string {
		let code = '';
		for (let i = 0; i < length; i++) {
			code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)];
		}
		return code;
	}

	/**
	 * Create auto-generated referral code for a new user
	 * Called during user registration
	 */
	async createAutoCode(userId: string): Promise<ReferralCode> {
		const db = this.getDb();

		// Check if user already has an auto code
		const [existingCode] = await db
			.select()
			.from(codes)
			.where(and(eq(codes.userId, userId), eq(codes.type, 'auto')))
			.limit(1);

		if (existingCode) {
			return existingCode;
		}

		// Generate unique code with retry logic
		let code: string;
		let attempts = 0;
		const maxAttempts = 10;

		while (attempts < maxAttempts) {
			code = this.generateRandomCode();

			try {
				const [newCode] = await db
					.insert(codes)
					.values({
						userId,
						code,
						type: 'auto',
						isActive: true,
						usesCount: 0,
					})
					.returning();

				return newCode;
			} catch (error: unknown) {
				// Code already exists, try again
				if (error instanceof Error && error.message?.includes('unique')) {
					attempts++;
					continue;
				}
				throw error;
			}
		}

		throw new Error('Failed to generate unique referral code after max attempts');
	}

	/**
	 * Create a custom referral code for a user
	 */
	async createCustomCode(userId: string, dto: CreateCustomCodeDto): Promise<ReferralCode> {
		const db = this.getDb();

		// Check rate limit
		await this.checkRateLimit(userId, 'code_creation');

		// Normalize code to uppercase
		const normalizedCode = dto.code.toUpperCase().trim();

		// Validate code format
		if (!/^[A-Z0-9-]{3,20}$/.test(normalizedCode)) {
			throw new BadRequestException(
				'Code must be 3-20 characters and contain only letters, numbers, and hyphens'
			);
		}

		// Check if code already exists (globally unique)
		const [existingCode] = await db
			.select()
			.from(codes)
			.where(eq(codes.code, normalizedCode))
			.limit(1);

		if (existingCode) {
			throw new ConflictException('This code is already taken');
		}

		// Create the custom code
		try {
			const [newCode] = await db
				.insert(codes)
				.values({
					userId,
					code: normalizedCode,
					type: 'custom',
					sourceAppId: dto.sourceAppId,
					isActive: true,
					usesCount: 0,
				})
				.returning();

			// Record rate limit usage
			await this.recordRateLimitUsage(userId, 'code_creation');

			return newCode;
		} catch (error: unknown) {
			if (error instanceof Error && error.message?.includes('unique')) {
				throw new ConflictException('This code is already taken');
			}
			throw error;
		}
	}

	/**
	 * Get all codes for a user
	 */
	async getUserCodes(userId: string): Promise<ReferralCodeResponse[]> {
		const db = this.getDb();

		const userCodes = await db
			.select()
			.from(codes)
			.where(eq(codes.userId, userId))
			.orderBy(codes.createdAt);

		return userCodes.map((code) => ({
			id: code.id,
			code: code.code,
			type: code.type as 'auto' | 'custom' | 'campaign',
			isActive: code.isActive,
			usesCount: code.usesCount,
			createdAt: code.createdAt,
		}));
	}

	/**
	 * Get a user's primary (auto-generated) code
	 */
	async getPrimaryCode(userId: string): Promise<string | null> {
		const db = this.getDb();

		const [autoCode] = await db
			.select()
			.from(codes)
			.where(and(eq(codes.userId, userId), eq(codes.type, 'auto')))
			.limit(1);

		return autoCode?.code || null;
	}

	/**
	 * Validate a referral code (public endpoint for registration)
	 */
	async validateCode(code: string): Promise<CodeValidationResponse> {
		const db = this.getDb();

		const normalizedCode = code.toUpperCase().trim();

		// Find the code with user info
		const result = await db
			.select({
				code: codes,
				user: {
					id: users.id,
					name: users.name,
				},
			})
			.from(codes)
			.innerJoin(users, eq(codes.userId, users.id))
			.where(eq(codes.code, normalizedCode))
			.limit(1);

		if (result.length === 0) {
			return {
				valid: false,
				bonusCredits: 0,
				error: 'invalid',
			};
		}

		const { code: referralCode, user } = result[0];

		// Check if code is active
		if (!referralCode.isActive) {
			return {
				valid: false,
				bonusCredits: 0,
				error: 'inactive',
			};
		}

		// Check expiration
		if (referralCode.expiresAt && new Date() > referralCode.expiresAt) {
			return {
				valid: false,
				bonusCredits: 0,
				error: 'expired',
			};
		}

		// Check max uses
		if (referralCode.maxUses && referralCode.usesCount >= referralCode.maxUses) {
			return {
				valid: false,
				bonusCredits: 0,
				error: 'max_uses',
			};
		}

		// Anonymize referrer name (e.g., "Till Schneider" -> "Till S.")
		const anonymizedName = this.anonymizeName(user.name);

		return {
			valid: true,
			referrerName: anonymizedName,
			bonusCredits: 25, // Referee bonus
		};
	}

	/**
	 * Get code by code string (internal use)
	 */
	async getCodeByString(code: string): Promise<ReferralCode | null> {
		const db = this.getDb();

		const [referralCode] = await db
			.select()
			.from(codes)
			.where(eq(codes.code, code.toUpperCase().trim()))
			.limit(1);

		return referralCode || null;
	}

	/**
	 * Increment the use count of a code
	 */
	async incrementUseCount(codeId: string): Promise<void> {
		const db = this.getDb();

		await db
			.update(codes)
			.set({
				usesCount: sql`${codes.usesCount} + 1`,
			})
			.where(eq(codes.id, codeId));
	}

	/**
	 * Deactivate a code
	 */
	async deactivateCode(userId: string, codeId: string): Promise<boolean> {
		const db = this.getDb();

		// Only allow deactivating own codes
		const result = await db
			.update(codes)
			.set({ isActive: false })
			.where(and(eq(codes.id, codeId), eq(codes.userId, userId)))
			.returning();

		return result.length > 0;
	}

	/**
	 * Anonymize a name for display (e.g., "Till Schneider" -> "Till S.")
	 */
	private anonymizeName(name: string): string {
		const parts = name.trim().split(/\s+/);
		if (parts.length === 1) {
			return parts[0];
		}
		const firstName = parts[0];
		const lastInitial = parts[parts.length - 1][0];
		return `${firstName} ${lastInitial}.`;
	}

	/**
	 * Check rate limit for an action
	 */
	private async checkRateLimit(identifier: string, action: string): Promise<void> {
		const db = this.getDb();
		const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS];

		if (!config) return;

		const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);

		// Count recent actions
		const [result] = await db
			.select({
				count: sql<number>`COALESCE(SUM(${rateLimits.count}), 0)`,
			})
			.from(rateLimits)
			.where(
				and(
					eq(rateLimits.identifier, identifier),
					eq(rateLimits.identifierType, 'user'),
					eq(rateLimits.action, action),
					sql`${rateLimits.windowStart} >= ${windowStart}`
				)
			);

		const count = Number(result?.count || 0);

		if (count >= config.limit) {
			throw new BadRequestException(
				`Rate limit exceeded. Please try again in ${config.windowMinutes} minutes.`
			);
		}
	}

	/**
	 * Record rate limit usage
	 */
	private async recordRateLimitUsage(identifier: string, action: string): Promise<void> {
		const db = this.getDb();
		const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS];

		if (!config) return;

		const now = new Date();
		const windowEnd = new Date(now.getTime() + config.windowMinutes * 60 * 1000);

		await db.insert(rateLimits).values({
			identifier,
			identifierType: 'user',
			action,
			count: 1,
			windowStart: now,
			windowEnd,
		});
	}
}
