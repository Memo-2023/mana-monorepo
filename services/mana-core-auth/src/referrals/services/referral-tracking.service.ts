/**
 * Referral Tracking Service
 *
 * Core service for tracking referral relationships and stage progression.
 * Handles:
 * - Applying referral codes during registration
 * - Stage transitions (registered -> activated -> qualified -> retained)
 * - Bonus calculations and payouts
 * - Cross-app tracking
 */

import {
	Injectable,
	BadRequestException,
	NotFoundException,
	ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, sql, desc, isNotNull, count } from 'drizzle-orm';
import { getDb } from '../../db/connection';
import {
	codes,
	relationships,
	crossAppActivations,
	bonusEvents,
	userTiers,
	dailyStats,
	BONUS_AMOUNTS,
	FRAUD_THRESHOLDS,
	TIMING_RULES,
	TRACKABLE_APPS,
	type ReferralRelationship,
	type NewReferralRelationship,
} from '../../db/schema/referrals.schema';
import { users } from '../../db/schema/auth.schema';
import { balances, transactions } from '../../db/schema/credits.schema';
import { ReferralCodeService } from './referral-code.service';
import { ReferralTierService } from './referral-tier.service';
import type {
	ApplyReferralDto,
	ApplyReferralResponse,
	ReferralStats,
	ReferredUser,
	PaginatedResponse,
} from '../dto';

type TierName = 'bronze' | 'silver' | 'gold' | 'platinum';

@Injectable()
export class ReferralTrackingService {
	constructor(
		private configService: ConfigService,
		private codeService: ReferralCodeService,
		private tierService: ReferralTierService
	) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Apply a referral code during user registration
	 */
	async applyReferral(dto: ApplyReferralDto): Promise<ApplyReferralResponse> {
		const db = this.getDb();

		// 1. Validate the code
		const referralCode = await this.codeService.getCodeByString(dto.code);
		if (!referralCode) {
			return { success: false, error: 'invalid_code' };
		}

		// 2. Check if code is active and not expired/maxed
		if (!referralCode.isActive) {
			return { success: false, error: 'code_inactive' };
		}
		if (referralCode.expiresAt && new Date() > referralCode.expiresAt) {
			return { success: false, error: 'code_expired' };
		}
		if (referralCode.maxUses && referralCode.usesCount >= referralCode.maxUses) {
			return { success: false, error: 'code_max_uses' };
		}

		// 3. Prevent self-referral
		if (referralCode.userId === dto.refereeId) {
			return { success: false, error: 'self_referral' };
		}

		// 4. Check if user was already referred
		const [existingReferral] = await db
			.select()
			.from(relationships)
			.where(eq(relationships.refereeId, dto.refereeId))
			.limit(1);

		if (existingReferral) {
			return { success: false, error: 'already_referred' };
		}

		// 5. Calculate initial fraud score (basic checks)
		const fraudScore = await this.calculateInitialFraudScore(
			referralCode.userId,
			dto.refereeId,
			dto.ipAddress,
			dto.deviceFingerprint
		);

		// 6. Create the referral relationship
		const [referral] = await db
			.insert(relationships)
			.values({
				referrerId: referralCode.userId,
				refereeId: dto.refereeId,
				codeId: referralCode.id,
				sourceAppId: dto.sourceAppId,
				status: 'registered',
				fraudScore,
				fraudSignals: '[]', // Will be populated by fraud detection
				isFlagged: fraudScore >= FRAUD_THRESHOLDS.highRisk,
			})
			.returning();

		// 7. Increment code use count
		await this.codeService.incrementUseCount(referralCode.id);

		// 8. Award registration bonuses
		let bonusAwarded = 0;

		// Referee bonus (25 credits) - always paid immediately
		const refereeBonusPaid = await this.awardBonus(
			referral.id,
			dto.refereeId,
			'registered',
			false, // isReferrer
			fraudScore
		);
		if (refereeBonusPaid > 0) {
			bonusAwarded += refereeBonusPaid;
		}

		// Referrer bonus (5 credits × tier) - may be held for fraud review
		await this.awardBonus(
			referral.id,
			referralCode.userId,
			'registered',
			true, // isReferrer
			fraudScore
		);

		// 9. Update daily stats
		await this.updateDailyStats(dto.sourceAppId, 'registrations', 1);

		return {
			success: true,
			referralId: referral.id,
			bonusAwarded,
			fraudScore,
		};
	}

	/**
	 * Check if a user should be marked as activated (first credit usage)
	 */
	async checkActivation(userId: string): Promise<boolean> {
		const db = this.getDb();

		// Find the referral where this user is the referee
		const [referral] = await db
			.select()
			.from(relationships)
			.where(and(eq(relationships.refereeId, userId), eq(relationships.status, 'registered')))
			.limit(1);

		if (!referral) {
			return false; // User wasn't referred or already activated
		}

		// Check timing rule
		const timeSinceRegistration = Date.now() - referral.registeredAt.getTime();
		if (timeSinceRegistration < TIMING_RULES.minTimeToActivation) {
			return false; // Too soon
		}

		// Update to activated status
		await db
			.update(relationships)
			.set({
				status: 'activated',
				activatedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(relationships.id, referral.id));

		// Award activation bonus to referrer
		await this.awardBonus(referral.id, referral.referrerId, 'activated', true, referral.fraudScore);

		// Update daily stats
		await this.updateDailyStats(referral.sourceAppId, 'activations', 1);

		return true;
	}

	/**
	 * Check if a user should be marked as qualified (first purchase)
	 */
	async checkQualification(userId: string): Promise<boolean> {
		const db = this.getDb();

		// Find the referral where this user is the referee
		const [referral] = await db
			.select()
			.from(relationships)
			.where(
				and(
					eq(relationships.refereeId, userId),
					sql`${relationships.status} IN ('registered', 'activated')`
				)
			)
			.limit(1);

		if (!referral) {
			return false; // User wasn't referred or already qualified
		}

		// Check timing rule (24h minimum)
		const timeSinceRegistration = Date.now() - referral.registeredAt.getTime();
		if (timeSinceRegistration < TIMING_RULES.minTimeToQualification) {
			// Flag for potential fraud but still process
			await this.addFraudSignal(referral.id, 'instant_qualification');
		}

		// Update to qualified status
		await db
			.update(relationships)
			.set({
				status: 'qualified',
				qualifiedAt: new Date(),
				// Also mark as activated if not already
				activatedAt: referral.activatedAt || new Date(),
				updatedAt: new Date(),
			})
			.where(eq(relationships.id, referral.id));

		// Award qualification bonus to referrer
		await this.awardBonus(referral.id, referral.referrerId, 'qualified', true, referral.fraudScore);

		// Increment referrer's qualified count (affects tier)
		await this.tierService.incrementQualifiedCount(referral.referrerId);

		// Update daily stats
		await this.updateDailyStats(referral.sourceAppId, 'qualifications', 1);

		return true;
	}

	/**
	 * Track cross-app usage and award bonus
	 */
	async trackCrossAppUsage(userId: string, appId: string): Promise<boolean> {
		const db = this.getDb();

		// Check if this is a trackable app
		if (!TRACKABLE_APPS.includes(appId as any)) {
			return false;
		}

		// Find the referral where this user is the referee
		const [referral] = await db
			.select()
			.from(relationships)
			.where(eq(relationships.refereeId, userId))
			.limit(1);

		if (!referral) {
			return false; // User wasn't referred
		}

		// Check if this app was already tracked
		const [existing] = await db
			.select()
			.from(crossAppActivations)
			.where(
				and(
					eq(crossAppActivations.relationshipId, referral.id),
					eq(crossAppActivations.appId, appId)
				)
			)
			.limit(1);

		if (existing) {
			return false; // Already tracked
		}

		// Record cross-app activation
		await db.insert(crossAppActivations).values({
			relationshipId: referral.id,
			appId,
			bonusPaid: false,
		});

		// Award cross-app bonus to referrer
		const bonusPaid = await this.awardBonus(
			referral.id,
			referral.referrerId,
			'cross_app',
			true,
			referral.fraudScore,
			appId
		);

		// Update the activation record
		if (bonusPaid > 0) {
			await db
				.update(crossAppActivations)
				.set({ bonusPaid: true })
				.where(
					and(
						eq(crossAppActivations.relationshipId, referral.id),
						eq(crossAppActivations.appId, appId)
					)
				);
		}

		return true;
	}

	/**
	 * Process retention check (called by cron job)
	 * Users who are still active 30 days after registration
	 */
	async processRetentionBatch(): Promise<number> {
		const db = this.getDb();

		const thirtyDaysAgo = new Date(
			Date.now() - TIMING_RULES.retentionCheckDays * 24 * 60 * 60 * 1000
		);

		// Find referrals that are qualified and registered 30+ days ago
		const eligibleReferrals = await db
			.select()
			.from(relationships)
			.where(
				and(
					eq(relationships.status, 'qualified'),
					sql`${relationships.retainedAt} IS NULL`,
					sql`${relationships.registeredAt} <= ${thirtyDaysAgo}`
				)
			)
			.limit(100); // Process in batches

		let processed = 0;

		for (const referral of eligibleReferrals) {
			// Check if referee has been active (has transactions in last 7 days)
			const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			const [recentActivity] = await db
				.select({ count: count() })
				.from(transactions)
				.where(
					and(
						eq(transactions.userId, referral.refereeId),
						sql`${transactions.createdAt} >= ${sevenDaysAgo}`
					)
				);

			if (Number(recentActivity?.count || 0) > 0) {
				// User is retained!
				await db
					.update(relationships)
					.set({
						status: 'retained',
						retainedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(relationships.id, referral.id));

				// Award retention bonus
				await this.awardBonus(
					referral.id,
					referral.referrerId,
					'retained',
					true,
					referral.fraudScore
				);

				// Update daily stats
				await this.updateDailyStats(referral.sourceAppId, 'retentions', 1);

				processed++;
			}
		}

		return processed;
	}

	/**
	 * Get referral statistics for a user
	 */
	async getReferralStats(userId: string): Promise<ReferralStats> {
		const db = this.getDb();

		// Get tier info
		const tierInfo = await this.tierService.getUserTier(userId);

		// Get totals
		const [totals] = await db
			.select({
				registered: sql<number>`COUNT(*)`,
				activated: sql<number>`COUNT(*) FILTER (WHERE ${relationships.activatedAt} IS NOT NULL)`,
				qualified: sql<number>`COUNT(*) FILTER (WHERE ${relationships.qualifiedAt} IS NOT NULL)`,
				retained: sql<number>`COUNT(*) FILTER (WHERE ${relationships.retainedAt} IS NOT NULL)`,
			})
			.from(relationships)
			.where(eq(relationships.referrerId, userId));

		// Get earnings
		const [earnings] = await db
			.select({
				paid: sql<number>`COALESCE(SUM(${bonusEvents.creditsFinal}) FILTER (WHERE ${bonusEvents.status} = 'paid'), 0)`,
				pending: sql<number>`COALESCE(SUM(${bonusEvents.creditsFinal}) FILTER (WHERE ${bonusEvents.status} IN ('pending', 'held')), 0)`,
			})
			.from(bonusEvents)
			.where(eq(bonusEvents.userId, userId));

		// Get stats by app
		const byAppResults = await db
			.select({
				appId: relationships.sourceAppId,
				registered: sql<number>`COUNT(*)`,
				activated: sql<number>`COUNT(*) FILTER (WHERE ${relationships.activatedAt} IS NOT NULL)`,
				qualified: sql<number>`COUNT(*) FILTER (WHERE ${relationships.qualifiedAt} IS NOT NULL)`,
			})
			.from(relationships)
			.where(eq(relationships.referrerId, userId))
			.groupBy(relationships.sourceAppId);

		const byApp: ReferralStats['byApp'] = {};
		for (const row of byAppResults) {
			if (row.appId) {
				byApp[row.appId] = {
					registered: Number(row.registered),
					activated: Number(row.activated),
					qualified: Number(row.qualified),
					credits: 0, // Would need to join with bonusEvents
				};
			}
		}

		// Get recent activity
		const recentEvents = await db
			.select({
				type: bonusEvents.eventType,
				credits: bonusEvents.creditsFinal,
				at: bonusEvents.createdAt,
				refereeId: relationships.refereeId,
				appId: bonusEvents.appId,
			})
			.from(bonusEvents)
			.innerJoin(relationships, eq(bonusEvents.relationshipId, relationships.id))
			.where(eq(bonusEvents.userId, userId))
			.orderBy(desc(bonusEvents.createdAt))
			.limit(10);

		// Get referee names for recent activity
		const recentActivity: ReferralStats['recentActivity'] = [];
		for (const event of recentEvents) {
			const [referee] = await db
				.select({ name: users.name })
				.from(users)
				.where(eq(users.id, event.refereeId))
				.limit(1);

			recentActivity.push({
				type: event.type,
				refereeName: this.anonymizeName(referee?.name || 'User'),
				credits: event.credits,
				app: event.appId || undefined,
				at: event.at,
			});
		}

		return {
			tier: tierInfo,
			totals: {
				registered: Number(totals?.registered || 0),
				activated: Number(totals?.activated || 0),
				qualified: Number(totals?.qualified || 0),
				retained: Number(totals?.retained || 0),
				creditsEarned: Number(earnings?.paid || 0),
				creditsPending: Number(earnings?.pending || 0),
			},
			byApp,
			recentActivity,
		};
	}

	/**
	 * Get list of referred users
	 */
	async getReferredUsers(
		userId: string,
		status?: string,
		limit = 20,
		offset = 0
	): Promise<PaginatedResponse<ReferredUser>> {
		const db = this.getDb();

		// Build where clause
		let whereClause = eq(relationships.referrerId, userId);
		if (status && status !== 'all') {
			whereClause = and(whereClause, eq(relationships.status, status as any))!;
		}

		// Get total count
		const [countResult] = await db
			.select({ total: count() })
			.from(relationships)
			.where(whereClause);

		// Get referrals with user info
		const referrals = await db
			.select({
				relationship: relationships,
				user: {
					id: users.id,
					name: users.name,
				},
			})
			.from(relationships)
			.innerJoin(users, eq(relationships.refereeId, users.id))
			.where(whereClause)
			.orderBy(desc(relationships.createdAt))
			.limit(limit)
			.offset(offset);

		// Get apps used and credits earned for each
		const items: ReferredUser[] = [];
		for (const { relationship, user } of referrals) {
			// Get apps used
			const appsUsed = await db
				.select({ appId: crossAppActivations.appId })
				.from(crossAppActivations)
				.where(eq(crossAppActivations.relationshipId, relationship.id));

			// Get credits earned from this referral
			const [creditsResult] = await db
				.select({
					total: sql<number>`COALESCE(SUM(${bonusEvents.creditsFinal}), 0)`,
				})
				.from(bonusEvents)
				.where(
					and(eq(bonusEvents.relationshipId, relationship.id), eq(bonusEvents.status, 'paid'))
				);

			items.push({
				id: relationship.id,
				name: this.anonymizeName(user.name),
				status: relationship.status as ReferredUser['status'],
				registeredAt: relationship.registeredAt,
				activatedAt: relationship.activatedAt || undefined,
				qualifiedAt: relationship.qualifiedAt || undefined,
				retainedAt: relationship.retainedAt || undefined,
				appsUsed: appsUsed.map((a) => a.appId),
				creditsEarned: Number(creditsResult?.total || 0),
				isFlagged: relationship.isFlagged,
			});
		}

		return {
			items,
			pagination: {
				total: Number(countResult?.total || 0),
				limit,
				offset,
			},
		};
	}

	// ============================================
	// PRIVATE HELPER METHODS
	// ============================================

	/**
	 * Award bonus credits to a user
	 */
	private async awardBonus(
		relationshipId: string,
		userId: string,
		eventType: keyof typeof BONUS_AMOUNTS,
		isReferrer: boolean,
		fraudScore: number,
		appId?: string
	): Promise<number> {
		const db = this.getDb();

		// Get user's tier
		const tierInfo = await this.tierService.getUserTier(userId);
		const tier = tierInfo.current as TierName;

		// Calculate bonus
		const { base, multiplier, final } = this.tierService.calculateBonus(
			eventType,
			tier,
			isReferrer
		);

		if (final === 0) {
			return 0;
		}

		// Determine if bonus should be held
		let status: 'pending' | 'held' = 'pending';
		let holdReason: string | null = null;
		let holdUntil: Date | null = null;

		if (fraudScore >= FRAUD_THRESHOLDS.highRisk) {
			status = 'held';
			holdReason = 'high_fraud_score';
		} else if (fraudScore >= FRAUD_THRESHOLDS.mediumRisk) {
			status = 'held';
			holdReason = 'medium_fraud_score';
			holdUntil = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h hold
		}

		// Create bonus event record
		const [bonusEvent] = await db
			.insert(bonusEvents)
			.values({
				relationshipId,
				userId,
				eventType,
				appId,
				creditsBase: base,
				tierMultiplier: multiplier,
				creditsFinal: final,
				tierAtTime: tier,
				status,
				holdReason,
				holdUntil,
			})
			.returning();

		// If not held, pay immediately
		if (status === 'pending') {
			const transactionId = await this.creditBonus(userId, final, eventType, relationshipId);

			// Update bonus event with transaction ID and mark as paid
			await db
				.update(bonusEvents)
				.set({
					transactionId,
					status: 'paid',
					releasedAt: new Date(),
				})
				.where(eq(bonusEvents.id, bonusEvent.id));

			// Update tier's total earned
			await this.tierService.addEarnedCredits(userId, final);

			// Update daily stats
			await this.updateDailyStats(appId, 'creditsPaid', final);

			return final;
		} else {
			// Update daily stats for held credits
			await this.updateDailyStats(appId, 'creditsHeld', final);
			return 0;
		}
	}

	/**
	 * Credit bonus to user's balance
	 */
	private async creditBonus(
		userId: string,
		amount: number,
		reason: string,
		relationshipId: string
	): Promise<string> {
		const db = this.getDb();

		// Get current balance
		const [currentBalance] = await db
			.select()
			.from(balances)
			.where(eq(balances.userId, userId))
			.limit(1);

		if (!currentBalance) {
			throw new NotFoundException('User balance not found');
		}

		const newBalance = currentBalance.balance + amount;
		const newTotalEarned = currentBalance.totalEarned + amount;

		// Update balance (add to main balance, not free credits)
		await db
			.update(balances)
			.set({
				balance: newBalance,
				totalEarned: newTotalEarned,
				updatedAt: new Date(),
			})
			.where(eq(balances.userId, userId));

		// Create transaction record (using 'gift' type for referral bonuses)
		const [transaction] = await db
			.insert(transactions)
			.values({
				userId,
				type: 'gift',
				status: 'completed',
				amount,
				balanceBefore: currentBalance.balance,
				balanceAfter: newBalance,
				appId: 'referral',
				description: `Referral bonus: ${reason}`,
				completedAt: new Date(),
			})
			.returning();

		return transaction.id;
	}

	/**
	 * Calculate initial fraud score
	 */
	private async calculateInitialFraudScore(
		referrerId: string,
		refereeId: string,
		ipAddress?: string,
		deviceFingerprint?: string
	): Promise<number> {
		// Basic fraud score calculation
		// Full fraud detection will be implemented in Phase 3
		const score = 0;

		// For now, just return 0 (no fraud detected)
		// TODO: Implement full fraud detection in Phase 3

		return score;
	}

	/**
	 * Add a fraud signal to a referral
	 */
	private async addFraudSignal(relationshipId: string, signal: string): Promise<void> {
		const db = this.getDb();

		const [referral] = await db
			.select()
			.from(relationships)
			.where(eq(relationships.id, relationshipId))
			.limit(1);

		if (!referral) return;

		const signals: string[] = referral.fraudSignals ? JSON.parse(referral.fraudSignals) : [];

		if (!signals.includes(signal)) {
			signals.push(signal);

			await db
				.update(relationships)
				.set({
					fraudSignals: JSON.stringify(signals),
					updatedAt: new Date(),
				})
				.where(eq(relationships.id, relationshipId));
		}
	}

	/**
	 * Update daily stats
	 */
	private async updateDailyStats(
		appId: string | null | undefined,
		field: keyof typeof dailyStats.$inferSelect,
		increment: number
	): Promise<void> {
		const db = this.getDb();

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Upsert daily stats
		// Note: This is a simplified version. In production, use proper upsert
		try {
			const [existing] = await db
				.select()
				.from(dailyStats)
				.where(
					and(
						eq(dailyStats.date, today),
						appId ? eq(dailyStats.appId, appId) : sql`${dailyStats.appId} IS NULL`
					)
				)
				.limit(1);

			if (existing) {
				await db
					.update(dailyStats)
					.set({
						[field]: sql`${dailyStats[field as keyof typeof dailyStats]} + ${increment}`,
					})
					.where(eq(dailyStats.id, existing.id));
			} else {
				await db.insert(dailyStats).values({
					date: today,
					appId: appId || null,
					[field]: increment,
				});
			}
		} catch {
			// Ignore stats update failures
		}
	}

	/**
	 * Anonymize a name for display
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
}
