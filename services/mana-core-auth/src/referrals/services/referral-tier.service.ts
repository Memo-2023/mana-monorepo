/**
 * Referral Tier Service
 *
 * Handles tier calculation and bonus multipliers.
 * Tiers are based on lifetime qualified referrals:
 * - Bronze: 0-4 (1.0x)
 * - Silver: 5-14 (1.5x)
 * - Gold: 15-29 (2.0x)
 * - Platinum: 30+ (3.0x)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../../db/connection';
import {
	userTiers,
	relationships,
	TIER_CONFIG,
	BONUS_AMOUNTS,
	type UserTier,
} from '../../db/schema/referrals.schema';
import type { TierInfo } from '../dto';

type TierName = 'bronze' | 'silver' | 'gold' | 'platinum';

@Injectable()
export class ReferralTierService {
	constructor(private configService: ConfigService) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Initialize tier record for a new user
	 */
	async initializeUserTier(userId: string): Promise<UserTier> {
		const db = this.getDb();

		// Check if already exists
		const [existing] = await db
			.select()
			.from(userTiers)
			.where(eq(userTiers.userId, userId))
			.limit(1);

		if (existing) {
			return existing;
		}

		const [tier] = await db
			.insert(userTiers)
			.values({
				userId,
				tier: 'bronze',
				qualifiedCount: 0,
				totalEarned: 0,
			})
			.returning();

		return tier;
	}

	/**
	 * Get user's current tier info
	 */
	async getUserTier(userId: string): Promise<TierInfo> {
		const db = this.getDb();

		let [tier] = await db.select().from(userTiers).where(eq(userTiers.userId, userId)).limit(1);

		// Initialize if doesn't exist
		if (!tier) {
			tier = await this.initializeUserTier(userId);
		}

		return this.buildTierInfo(tier);
	}

	/**
	 * Get the multiplier for a given tier name
	 */
	getMultiplierForTier(tier: TierName): number {
		return TIER_CONFIG[tier]?.multiplier || 1.0;
	}

	/**
	 * Get the multiplier for a user by their ID
	 */
	async getMultiplier(userId: string): Promise<number> {
		const db = this.getDb();

		const [tier] = await db.select().from(userTiers).where(eq(userTiers.userId, userId)).limit(1);

		if (!tier) {
			return 1.0; // Default bronze multiplier
		}

		return this.getMultiplierForTier(tier.tier as TierName);
	}

	/**
	 * Calculate bonus credits with tier multiplier
	 */
	calculateBonus(
		eventType: keyof typeof BONUS_AMOUNTS,
		tier: TierName,
		isReferrer = true
	): { base: number; multiplier: number; final: number } {
		const bonusConfig = BONUS_AMOUNTS[eventType];
		const base = isReferrer ? bonusConfig.referrer : bonusConfig.referee;
		const multiplier = isReferrer ? this.getMultiplierForTier(tier) : 1.0; // Referee doesn't get tier bonus
		const final = Math.round(base * multiplier);

		return { base, multiplier, final };
	}

	/**
	 * Increment qualified count and potentially upgrade tier
	 * Called when a referral reaches 'qualified' status
	 */
	async incrementQualifiedCount(userId: string): Promise<{
		newTier: TierName;
		upgraded: boolean;
		previousTier: TierName;
	}> {
		const db = this.getDb();

		// Get current tier with lock
		const [currentTier] = await db
			.select()
			.from(userTiers)
			.where(eq(userTiers.userId, userId))
			.limit(1);

		if (!currentTier) {
			// Initialize and return
			await this.initializeUserTier(userId);
			return {
				newTier: 'bronze',
				upgraded: false,
				previousTier: 'bronze',
			};
		}

		const previousTier = currentTier.tier as TierName;
		const newQualifiedCount = currentTier.qualifiedCount + 1;
		const newTier = this.calculateTierFromCount(newQualifiedCount);
		const upgraded = newTier !== previousTier;

		// Update tier
		await db
			.update(userTiers)
			.set({
				qualifiedCount: newQualifiedCount,
				tier: newTier,
				updatedAt: new Date(),
			})
			.where(eq(userTiers.userId, userId));

		return {
			newTier,
			upgraded,
			previousTier,
		};
	}

	/**
	 * Add earned credits to user's tier record
	 */
	async addEarnedCredits(userId: string, credits: number): Promise<void> {
		const db = this.getDb();

		await db
			.update(userTiers)
			.set({
				totalEarned: sql`${userTiers.totalEarned} + ${credits}`,
				updatedAt: new Date(),
			})
			.where(eq(userTiers.userId, userId));
	}

	/**
	 * Recalculate tier based on actual qualified referrals
	 * (Used for data integrity checks)
	 */
	async recalculateTier(userId: string): Promise<TierName> {
		const db = this.getDb();

		// Count actual qualified referrals
		const [result] = await db
			.select({
				count: sql<number>`COUNT(*)`,
			})
			.from(relationships)
			.where(
				sql`${relationships.referrerId} = ${userId} AND ${relationships.qualifiedAt} IS NOT NULL`
			);

		const qualifiedCount = Number(result?.count || 0);
		const tier = this.calculateTierFromCount(qualifiedCount);

		// Update tier record
		await db
			.update(userTiers)
			.set({
				qualifiedCount,
				tier,
				updatedAt: new Date(),
			})
			.where(eq(userTiers.userId, userId));

		return tier;
	}

	/**
	 * Calculate tier from qualified count
	 */
	calculateTierFromCount(count: number): TierName {
		if (count >= TIER_CONFIG.platinum.minQualified) return 'platinum';
		if (count >= TIER_CONFIG.gold.minQualified) return 'gold';
		if (count >= TIER_CONFIG.silver.minQualified) return 'silver';
		return 'bronze';
	}

	/**
	 * Build TierInfo response object
	 */
	private buildTierInfo(tier: UserTier): TierInfo {
		const currentTier = tier.tier as TierName;
		const config = TIER_CONFIG[currentTier];

		// Determine next tier
		let nextTier: TierName | null = null;
		let nextTierAt: number | null = null;

		if (currentTier === 'bronze') {
			nextTier = 'silver';
			nextTierAt = TIER_CONFIG.silver.minQualified;
		} else if (currentTier === 'silver') {
			nextTier = 'gold';
			nextTierAt = TIER_CONFIG.gold.minQualified;
		} else if (currentTier === 'gold') {
			nextTier = 'platinum';
			nextTierAt = TIER_CONFIG.platinum.minQualified;
		}
		// Platinum has no next tier

		// Calculate progress
		let progress = 1.0;
		if (nextTierAt !== null) {
			const currentMin = config.minQualified;
			const range = nextTierAt - currentMin;
			const current = tier.qualifiedCount - currentMin;
			progress = Math.min(current / range, 1.0);
		}

		return {
			current: currentTier,
			multiplier: config.multiplier,
			qualifiedCount: tier.qualifiedCount,
			nextTier,
			nextTierAt,
			progress,
		};
	}
}
